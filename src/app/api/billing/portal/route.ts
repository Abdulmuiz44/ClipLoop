import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { refreshBillingManagementUrl } from "@/domains/billing/service";
import { checkoutStartResponseSchema } from "@/lib/validation/billing";
import { toErrorResponse } from "@/lib/http/errors";

export async function POST() {
  try {
    const user = await getCurrentUser();
    const result = await refreshBillingManagementUrl(user.id);
    const payload = checkoutStartResponseSchema.parse({ url: result.url });
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
