import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ProductAccessError } from "@/domains/account/service";
import { BillingConfigurationError, BillingPortalError } from "@/domains/billing/service";
import { UsageLimitError } from "@/domains/usage/service";

export function toErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.flatten() }, { status: 400 });
  }

  if (error instanceof ProductAccessError) {
    return NextResponse.json({ error: error.message, code: "PRODUCT_ACCESS_DENIED" }, { status: 403 });
  }

  if (error instanceof BillingConfigurationError) {
    return NextResponse.json({ error: error.message, code: "BILLING_NOT_CONFIGURED" }, { status: 503 });
  }

  if (error instanceof BillingPortalError) {
    return NextResponse.json({ error: error.message, code: "BILLING_PORTAL_UNAVAILABLE" }, { status: 400 });
  }

  if (error instanceof UsageLimitError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        limit: error.limit,
        used: error.used,
      },
      { status: 429 },
    );
  }

  return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
}
