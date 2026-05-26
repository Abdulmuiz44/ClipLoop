import { NextResponse } from "next/server";

import { ApiKeyAuthError } from "@/domains/api-keys/service";
import { listProjectsForUser } from "@/domains/projects/service";
import { toErrorResponse } from "@/lib/http/errors";
import { requireApiKeyIdentity, PublicApiAuthRequiredError } from "@/lib/public-api/auth";
import { assertHasScope } from "@/lib/public-api/guards";
import { consumeRateLimit, RateLimitExceededError } from "@/lib/public-api/rate-limit";

export async function GET(request: Request) {
  try {
    const identity = await requireApiKeyIdentity(request);

    await consumeRateLimit({
      apiKeyId: identity.apiKeyId,
      key: "public_projects_read",
      limit: 60,
      windowSec: 60,
    });

    const scope = assertHasScope(identity, "projects:read");
    if (!scope.ok) return NextResponse.json(scope.body, { status: scope.status });

    // If the key is pinned to a project, only return that project.
    if (identity.projectId) {
      const projects = await listProjectsForUser(identity.userId);
      const match = projects.find((p) => p.id === identity.projectId) ?? null;
      if (!match) return NextResponse.json({ error: "Project not found.", code: "NOT_FOUND" }, { status: 404 });
      return NextResponse.json({ projects: [match] }, { status: 200 });
    }

    const projects = await listProjectsForUser(identity.userId);
    return NextResponse.json({ projects }, { status: 200 });
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
