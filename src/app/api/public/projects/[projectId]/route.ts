import { NextResponse } from "next/server";

import { ApiKeyAuthError } from "@/domains/api-keys/service";
import { getProjectById } from "@/domains/projects/service";
import { toErrorResponse } from "@/lib/http/errors";
import { requireApiKeyIdentity, PublicApiAuthRequiredError } from "@/lib/public-api/auth";
import { assertHasScope, assertProjectScope } from "@/lib/public-api/guards";
import { consumeRateLimit, RateLimitExceededError } from "@/lib/public-api/rate-limit";

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const identity = await requireApiKeyIdentity(request);

    await consumeRateLimit({
      apiKeyId: identity.apiKeyId,
      key: "public_project_read",
      limit: 60,
      windowSec: 60,
    });

    const scope = assertHasScope(identity, "projects:read");
    if (!scope.ok) return NextResponse.json(scope.body, { status: scope.status });

    const { projectId } = await context.params;

    const scoped = assertProjectScope(identity, projectId);
    if (!scoped.ok) return NextResponse.json(scoped.body, { status: scoped.status });

    const project = await getProjectById(projectId, identity.userId);
    if (!project) return NextResponse.json({ error: "Project not found.", code: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({ project }, { status: 200 });
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
