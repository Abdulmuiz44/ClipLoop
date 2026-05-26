import { NextResponse } from "next/server";

import { ApiKeyAuthError } from "@/domains/api-keys/service";
import { getCreditWalletSummary } from "@/domains/credits/service";
import { toErrorResponse } from "@/lib/http/errors";
import { requireApiKeyIdentity, PublicApiAuthRequiredError } from "@/lib/public-api/auth";
import { assertHasScope } from "@/lib/public-api/guards";
import { consumeRateLimit, RateLimitExceededError } from "@/lib/public-api/rate-limit";

export async function GET(request: Request) {
  try {
    const identity = await requireApiKeyIdentity(request);

    await consumeRateLimit({
      apiKeyId: identity.apiKeyId,
      key: "public_credits_read",
      limit: 60,
      windowSec: 60,
    });

    const scope = assertHasScope(identity, "credits:read");
    if (!scope.ok) return NextResponse.json(scope.body, { status: scope.status });

    // Stricter scoping: credits reads require a project-pinned API key.
    // This avoids exposing account-wide billing data to keys intended for one project.
    if (!identity.projectId) {
      return NextResponse.json(
        { error: "This endpoint requires an API key pinned to a project.", code: "PROJECT_REQUIRED" },
        { status: 403 },
      );
    }

    const wallet = await getCreditWalletSummary(identity.userId);
    return NextResponse.json(wallet, { status: 200 });
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
    return toErrorResponse(error);
  }
}
