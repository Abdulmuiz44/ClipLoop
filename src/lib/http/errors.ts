import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ProductAccessError } from "@/domains/account/service";
import { BillingConfigurationError, BillingPortalError } from "@/domains/billing/service";
import { UsageLimitError } from "@/domains/usage/service";
import { InsufficientCreditsError } from "@/domains/credits/service";

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
    const suggestion =
      error.code.includes("PROJECT_")
        ? "Upgrade to Pro to create more projects."
        : error.code.includes("RENDER_")
          ? "Upgrade to Pro for more render credits."
          : error.code.includes("POSTS_")
            ? "Upgrade to Pro for more generation credits."
            : "Upgrade to Pro for higher limits.";
    return NextResponse.json(
      {
        error: error.message,
        suggestion,
        code: error.code,
        limit: error.limit,
        used: error.used,
      },
      { status: 429 },
    );
  }

  if (error instanceof InsufficientCreditsError) {
    return NextResponse.json(
      {
        error: error.message,
        suggestion: "Upgrade to Pro to continue generation and rendering.",
        code: "CREDITS_INSUFFICIENT",
        bucket: error.bucket,
        required: error.required,
        available: error.available,
      },
      { status: 402 },
    );
  }

  return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
}
