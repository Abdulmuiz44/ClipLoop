import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createStarterCheckout } from "@/domains/billing/service";
import { checkoutStartResponseSchema, starterCheckoutInputSchema } from "@/lib/validation/billing";
import { toErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request) {
  try {
    const body = starterCheckoutInputSchema.parse(await request.json().catch(() => ({})));
    let currentUser = null;

    try {
      currentUser = await getCurrentUser();
    } catch {}

    const resolvedEmail = currentUser?.email ?? body.email ?? null;

    if (!resolvedEmail) {
      throw new Error("Email is required to start Pro checkout.");
    }

    const result = await createStarterCheckout({
      userId: currentUser?.id ?? null,
      email: resolvedEmail,
      fullName: currentUser?.fullName ?? body.name ?? null,
    });

    const payload = checkoutStartResponseSchema.parse({ url: result.url });
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
