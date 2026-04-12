import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentUsageSummary } from "@/domains/account/service";
import { meUsageResponseSchema } from "@/lib/validation/billing";
import { toErrorResponse } from "@/lib/http/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const summary = await getCurrentUsageSummary(user.id);
    const payload = meUsageResponseSchema.parse(summary);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
