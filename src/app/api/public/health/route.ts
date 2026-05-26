import { NextResponse } from "next/server";

import { ApiKeyAuthError } from "@/domains/api-keys/service";
import { toErrorResponse } from "@/lib/http/errors";
import { requireApiKeyIdentity, PublicApiAuthRequiredError } from "@/lib/public-api/auth";
import { consumeRateLimit, RateLimitExceededError } from "@/lib/public-api/rate-limit";
import { isPublicApiScopeId, type PublicApiScopeId } from "@/lib/public-api/scopes";

function parseRequestedScopes(url: URL): PublicApiScopeId[] {
  // Accept either:
  // - ?scopes=usage:read,credits:read
  // - ?scope=usage:read&scope=credits:read
  const scopesParam = url.searchParams.get("scopes");
  const scopeParams = url.searchParams.getAll("scope");

  const raw: string[] = [];
  if (scopesParam) {
    raw.push(
      ...scopesParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }
  if (scopeParams.length) {
    raw.push(...scopeParams.map((s) => s.trim()).filter(Boolean));
  }

  const invalid = raw.filter((s) => !isPublicApiScopeId(s));
  if (invalid.length) {
    const err = new Error(`Invalid scope(s): ${invalid.join(", ")}`);
    // @ts-expect-error - lightweight tagging
    err.code = "INVALID_SCOPE";
    throw err;
  }

  return [...new Set(raw as PublicApiScopeId[])];
}

export async function GET(request: Request) {
  try {
    const identity = await requireApiKeyIdentity(request);

    await consumeRateLimit({
      apiKeyId: identity.apiKeyId,
      key: "public_health",
      limit: 30,
      windowSec: 60,
    });

    const url = new URL(request.url);
    const requestedScopes = parseRequestedScopes(url);

    const missingScopes = requestedScopes.filter((s) => !identity.scopes.includes(s));
    if (missingScopes.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "Insufficient scope.",
          code: "SCOPE_DENIED",
          missingScopes,
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        apiKeyId: identity.apiKeyId,
        userId: identity.userId,
        projectId: identity.projectId,
        scopes: identity.scopes,
        // echo what the client asked us to validate
        requestedScopes,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof PublicApiAuthRequiredError) {
      return NextResponse.json({ error: error.message, code: "API_KEY_REQUIRED" }, { status: 401 });
    }
    if (error instanceof ApiKeyAuthError) {
      return NextResponse.json({ error: error.message, code: "API_KEY_INVALID" }, { status: 401 });
    }
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        { error: error.message, code: "RATE_LIMIT_EXCEEDED", retryAfterSec: error.retryAfterSec },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSec) } },
      );
    }

    // Invalid scopes requested
    if (error && typeof error === "object" && "code" in error && (error as any).code === "INVALID_SCOPE") {
      return NextResponse.json({ error: (error as Error).message, code: "INVALID_SCOPE" }, { status: 400 });
    }

    return toErrorResponse(error);
  }
}
