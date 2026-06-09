import { NextResponse } from "next/server";
import { z } from "zod";

import { getBillingPolicy } from "@/core/billing/policy";
import { InsufficientCreditsError, assertCanAffordAction, chargeCredits } from "@/domains/credits/service";
import { recordUsageEvent } from "@/domains/usage-events/service";
import { runWeeklyPromoMvp, VideoRendererUnavailableError, VideoRenderFailedError } from "@/domains/weekly-promo/service";
import { ApiKeyAuthError } from "@/domains/api-keys/service";
import { toErrorResponse } from "@/lib/http/errors";
import { requireApiKeyIdentity, PublicApiAuthRequiredError } from "@/lib/public-api/auth";
import { consumeRateLimit, RateLimitExceededError } from "@/lib/public-api/rate-limit";
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  computeRequestHash,
  IdempotencyConflictError,
  IdempotencyInProgressError,
  IdempotencyKeyRequiredError,
} from "@/lib/public-api/idempotency";
import { weeklyPromoInputSchema } from "@/lib/validation/weekly-promo";

function logWeeklyPromoError(context: {
  idempotencyKey?: string;
  errorName?: string;
  code?: string;
  status?: number;
  message?: string;
  rendererStatus?: unknown;
  idempotencyCleanupRan?: boolean;
  requestId?: string;
}) {
  const safe = {
    route: "public-weekly-promo",
    idempotencyKey: context.idempotencyKey ? `${String(context.idempotencyKey).slice(0, 12)}...` : undefined,
    errorName: context.errorName,
    code: context.code,
    status: context.status,
    message: context.message,
    rendererStatus: context.rendererStatus,
    idempotencyCleanupRan: context.idempotencyCleanupRan,
    requestId: context.requestId,
    secretsExposed: false,
  };

  console.log("[weekly-promo][error]", JSON.stringify(safe));
}

function buildErrorBody(params: {
  code: string;
  message: string;
  debugMode: boolean;
  extra?: Record<string, unknown>;
}) {
  const base = { error: params.message, code: params.code };

  if (!params.debugMode) {
    return base;
  }

  return {
    ...base,
    debug: {
      route: "public-weekly-promo",
      code: params.code,
      status: 500,
      errorName: "Error",
      safeMessage: params.message,
      secretsExposed: false,
      ...params.extra,
    },
  };
}

export async function POST(request: Request) {
  try {
    return await handleWeeklyPromoPost(request);
  } catch (error) {
    const debugMode = request.headers.get("x-cliploop-debug") === "safe";
    const idempotencyKey = request.headers.get("Idempotency-Key") || request.headers.get("idempotency-key");
    const trimmedIdempotencyKey = idempotencyKey?.trim() ?? "";
    if (trimmedIdempotencyKey.length >= 8) {
      // Best-effort idempotency cleanup; swallow secondary failures safely.
      try {
        await completeIdempotentRequest({
          userId: "unknown",
          path: "/api/public/weekly-promo",
          key: trimmedIdempotencyKey,
          responseStatus: 500,
          responseJson: { error: "Request failed.", code: "REQUEST_FAILED" },
          status: "failed",
        });
      } catch {
        // ignore cleanup failures in outermost catch
      }
    }
    const body = buildErrorBody({
      code: "REQUEST_FAILED",
      message: error instanceof Error ? error.message : "Request failed",
      debugMode,
      extra: {
        errorName: error instanceof Error ? error.name : "Error",
        idempotencyKeyPrefix: trimmedIdempotencyKey ? trimmedIdempotencyKey.slice(0, 12) : undefined,
      },
    });
    return NextResponse.json(body, { status: 500 });
  }
}

async function handleWeeklyPromoPost(request: Request) {
  const debugMode = request.headers.get("x-cliploop-debug") === "safe";
  let idempotencyKeyForDebug: string | null = null;
  let idempotencyKey: string | null = null;
  let requestIdempotencyKey = "";
  let authenticatedUserId = "unknown";
  let idem: Awaited<ReturnType<typeof beginIdempotentRequest>> | null = null;
  const path = "/api/public/weekly-promo";

  console.log(
    JSON.stringify({
      route: "public-weekly-promo",
      event: "post_handler_started",
      idempotencyKeyPrefix: (request.headers.get("Idempotency-Key") || "").slice(0, 12) || undefined,
      debugMode,
      secretsExposed: false,
    }),
  );

  try {
    // 1. Authenticate via API key
    const identity = await requireApiKeyIdentity(request);
    authenticatedUserId = identity.userId;

    // 2. Rate limit
    await consumeRateLimit({
      apiKeyId: identity.apiKeyId,
      key: "public_weekly_promo",
      limit: 3,
      windowSec: 60,
    });

    // 3. Scope check — run BEFORE body parsing to fail fast
    if (!identity.scopes.includes("weekly_promo:generate")) {
      return NextResponse.json({ error: "Insufficient scope.", code: "SCOPE_DENIED" }, { status: 403 });
    }

    // 4. Idempotency key — require before body parsing
    idempotencyKey = request.headers.get("Idempotency-Key") || request.headers.get("idempotency-key");
    idempotencyKeyForDebug = idempotencyKey;
    if (!idempotencyKey || idempotencyKey.trim().length < 8) {
      throw new IdempotencyKeyRequiredError();
    }
    requestIdempotencyKey = idempotencyKey.trim();

    // 5. Parse and validate body EARLY — before idempotency to reject bad payloads fast
    const body = await request.json().catch(() => {
      throw new z.ZodError([
        { code: "custom", message: "Request body must be valid JSON.", path: [] } as any,
      ]);
    });
    const input = weeklyPromoInputSchema.parse(body);

    // 6. Idempotency — begin or replay
    const requestHash = computeRequestHash({ method: "POST", path, body: input });

    const idemResult = await beginIdempotentRequest({
      userId: authenticatedUserId,
      apiKeyId: identity.apiKeyId,
      key: requestIdempotencyKey,
      method: "POST",
      path,
      requestHash,
    });
    idem = idemResult;

    if (idemResult.kind === "replay") {
      return NextResponse.json(idemResult.responseJson, { status: idemResult.responseStatus });
    }

    // 7. Check billing policy
    const policy = getBillingPolicy("api_weekly_promo_generate");
    if (!policy || policy.billable !== true) {
      throw new Error("Billing policy missing for api_weekly_promo_generate");
    }
    const creditsCharged = policy.amount;

    // 8. Assert sufficient credits (early fail)
    await assertCanAffordAction(identity.userId, [{ bucket: policy.bucket, amount: policy.amount }]);

    // 9. Run the weekly promo service
    const result = await runWeeklyPromoMvp(input);

    // 10. Charge credits (after successful generation)
    await chargeCredits({
      userId: authenticatedUserId,
      bucket: policy.bucket,
      amount: policy.amount,
      reason: policy.reason,
      referenceType: "idempotency",
      referenceId: idemResult.referenceId,
      metadata: {
        action: "api_weekly_promo_generate",
        apiKeyPrefix: identity.keyPrefix,
      },
    });

    // 11. Record usage event with keyPrefix (not full apiKeyId) in metadata
    await recordUsageEvent({
      userId: authenticatedUserId,
      projectId: identity.projectId,
      apiKeyId: identity.apiKeyId,
      source: "public_api",
      action: "api_weekly_promo_generate",
      creditsBucket: policy.bucket,
      creditsAmount: policy.amount,
      referenceType: "idempotency",
      referenceId: idemResult.referenceId,
      metadata: {
        idempotencyKey: requestIdempotencyKey,
        keyPrefix: identity.keyPrefix,
      },
    });

    // 12. Shape response with all required fields
    const responseJson = {
      artifactId: result.id,
      previewUrl: result.preview.videoUrl,
      downloadUrl: result.preview.downloadUrl,
      artifactUrl: result.artifact.artifactUrl,
      script: result.script,
      scenePlan: result.scenePlan,
      creditsCharged,
      renderStatus: "rendered" as const,
      idempotencyKey: requestIdempotencyKey,
    };

    await completeIdempotentRequest({
      userId: authenticatedUserId,
      path,
      key: requestIdempotencyKey,
      responseStatus: 200,
      responseJson,
      status: "completed",
    });

    return NextResponse.json(responseJson);
  } catch (error) {
    // Public API auth errors
    if (error instanceof PublicApiAuthRequiredError) {
      return NextResponse.json({ error: error.message, code: "API_KEY_MISSING" }, { status: 401 });
    }
    if (error instanceof ApiKeyAuthError) {
      return NextResponse.json({ error: error.message, code: "API_KEY_INVALID" }, { status: 401 });
    }
    // Rate limit
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json(
        { error: error.message, code: "RATE_LIMIT_EXCEEDED", retryAfterSec: error.retryAfterSec },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSec) } },
      );
    }
    // Idempotency errors
    if (error instanceof IdempotencyKeyRequiredError) {
      return NextResponse.json({ error: error.message, code: "IDEMPOTENCY_KEY_REQUIRED" }, { status: 400 });
    }
    if (error instanceof IdempotencyConflictError) {
      return NextResponse.json({ error: error.message, code: "IDEMPOTENCY_CONFLICT" }, { status: 409 });
    }
    if (error instanceof IdempotencyInProgressError) {
      return NextResponse.json({ error: error.message, code: "IDEMPOTENCY_IN_PROGRESS" }, { status: 409 });
    }
    // Insufficient credits — 402
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: error.message,
          code: "CREDITS_INSUFFICIENT",
          bucket: error.bucket,
          required: error.required,
          available: error.available,
        },
        { status: 402 },
      );
    }
    // Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten(), code: "VALIDATION_ERROR" }, { status: 400 });
    }
    // Unknown errors
    if (error instanceof VideoRendererUnavailableError) {
      logWeeklyPromoError({
        idempotencyKey: requestIdempotencyKey,
        errorName: error.name,
        code: "VIDEO_RENDER_UNAVAILABLE",
        status: 503,
        message: error.message,
        idempotencyCleanupRan: idem?.kind === "new",
      });
      if (idem?.kind === "new") {
        await completeIdempotentRequest({
          userId: authenticatedUserId,
          path,
          key: requestIdempotencyKey,
          responseStatus: 503,
          responseJson: { error: error.message, code: "VIDEO_RENDER_UNAVAILABLE" },
          status: "failed",
        });
      }
      const body = buildErrorBody({
        code: "VIDEO_RENDER_UNAVAILABLE",
        message: error.message,
        debugMode,
        extra: {
          errorName: error.name,
          idempotencyKeyPrefix: requestIdempotencyKey.slice(0, 12),
          idempotencyCleanupRan: idem?.kind === "new",
        },
      });
      return NextResponse.json(body, { status: 503 });
    }
    if (error instanceof VideoRenderFailedError) {
      logWeeklyPromoError({
        idempotencyKey: requestIdempotencyKey,
        errorName: error.name,
        code: "VIDEO_RENDER_FAILED",
        status: 500,
        message: error.message,
        idempotencyCleanupRan: idem?.kind === "new",
      });
      if (idem?.kind === "new") {
        await completeIdempotentRequest({
          userId: authenticatedUserId,
          path,
          key: requestIdempotencyKey,
          responseStatus: 500,
          responseJson: { error: error.message, code: "VIDEO_RENDER_FAILED" },
          status: "failed",
        });
      }
      const body = buildErrorBody({
        code: "VIDEO_RENDER_FAILED",
        message: error.message,
        debugMode,
        extra: {
          errorName: error.name,
          idempotencyKeyPrefix: requestIdempotencyKey.slice(0, 12),
          idempotencyCleanupRan: idem?.kind === "new",
        },
      });
      return NextResponse.json(body, { status: 500 });
    }
    if (idem?.kind === "new") {
      await completeIdempotentRequest({
        userId: authenticatedUserId,
        path,
        key: requestIdempotencyKey,
        responseStatus: 500,
        responseJson: { error: error instanceof Error ? error.message : "Request failed", code: "REQUEST_FAILED" },
        status: "failed",
      });
    }
    logWeeklyPromoError({
      idempotencyKey: requestIdempotencyKey,
      errorName: error instanceof Error ? error.name : "Error",
      code: "REQUEST_FAILED",
      status: 500,
      message: error instanceof Error ? error.message : "Request failed",
      idempotencyCleanupRan: idem?.kind === "new",
    });
    const message = error instanceof Error ? error.message : "Request failed";
    const body = buildErrorBody({
      code: "REQUEST_FAILED",
      message,
      debugMode,
      extra: {
        errorName: error instanceof Error ? error.name : "Error",
        idempotencyKeyPrefix: requestIdempotencyKey.slice(0, 12),
        idempotencyCleanupRan: idem?.kind === "new",
      },
    });
    return NextResponse.json(body, { status: 500 });
  }
}
