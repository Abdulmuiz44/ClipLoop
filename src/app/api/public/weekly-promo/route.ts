import { NextResponse } from "next/server";
import { z } from "zod";

import { getBillingPolicy } from "@/core/billing/policy";
import { assertCanAffordAction, chargeCredits } from "@/domains/credits/service";
import { runWeeklyPromoMvp } from "@/domains/weekly-promo/service";
import { ApiKeyAuthError } from "@/domains/api-keys/service";
import { toErrorResponse } from "@/lib/http/errors";
import { requireApiKeyIdentity } from "@/lib/public-api/auth";
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  computeRequestHash,
  IdempotencyConflictError,
  IdempotencyInProgressError,
  IdempotencyKeyRequiredError,
} from "@/lib/public-api/idempotency";

const requestSchema = z.unknown();

export async function POST(request: Request) {
  try {
    const identity = await requireApiKeyIdentity(request);
    if (!identity.scopes.includes("weekly_promo:generate")) {
      return NextResponse.json({ error: "Insufficient scope.", code: "SCOPE_DENIED" }, { status: 403 });
    }

    const idempotencyKey = request.headers.get("Idempotency-Key") || request.headers.get("idempotency-key");
    if (!idempotencyKey || idempotencyKey.trim().length < 8) throw new IdempotencyKeyRequiredError();

    const body = await request.json().catch(() => ({}));
    requestSchema.parse(body);

    const path = "/api/public/weekly-promo";
    const requestHash = computeRequestHash({ method: "POST", path, body });

    const idem = await beginIdempotentRequest({
      userId: identity.userId,
      apiKeyId: identity.apiKeyId,
      key: idempotencyKey.trim(),
      method: "POST",
      path,
      requestHash,
    });

    if (idem.kind === "replay") {
      return NextResponse.json(idem.responseJson, { status: idem.responseStatus });
    }

    const policy = getBillingPolicy("api_weekly_promo_generate");
    if (!policy || policy.billable !== true) throw new Error("Billing policy missing for api_weekly_promo_generate");

    await assertCanAffordAction(identity.userId, [{ bucket: policy.bucket, amount: policy.amount }]);

    const result = await runWeeklyPromoMvp(body);

    await chargeCredits({
      userId: identity.userId,
      bucket: policy.bucket,
      amount: policy.amount,
      reason: policy.reason,
      referenceType: "idempotency",
      referenceId: idem.referenceId,
      metadata: {
        action: "api_weekly_promo_generate",
        apiKeyId: identity.apiKeyId,
      },
    });

    const responseJson = { result };
    await completeIdempotentRequest({
      userId: identity.userId,
      path,
      key: idempotencyKey.trim(),
      responseStatus: 200,
      responseJson,
      status: "completed",
    });

    return NextResponse.json(responseJson);
  } catch (error) {
    // Public API auth + idempotency errors
    if (error instanceof ApiKeyAuthError) {
      return NextResponse.json({ error: error.message, code: "API_KEY_INVALID" }, { status: 401 });
    }
    if (error instanceof IdempotencyKeyRequiredError) {
      return NextResponse.json({ error: error.message, code: "IDEMPOTENCY_KEY_REQUIRED" }, { status: 400 });
    }
    if (error instanceof IdempotencyConflictError) {
      return NextResponse.json({ error: error.message, code: "IDEMPOTENCY_CONFLICT" }, { status: 409 });
    }
    if (error instanceof IdempotencyInProgressError) {
      return NextResponse.json({ error: error.message, code: "IDEMPOTENCY_IN_PROGRESS" }, { status: 409 });
    }

    return toErrorResponse(error);
  }
}
