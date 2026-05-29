import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentUsageSummary } from "@/domains/account/service";
import { getDashboardUsageData } from "@/domains/account/usage-dashboard";
import { meUsageResponseSchema } from "@/lib/validation/billing";
import { toErrorResponse } from "@/lib/http/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const [summary, dashboard] = await Promise.all([
      getCurrentUsageSummary(user.id),
      getDashboardUsageData(user.id),
    ]);
    const payload = {
      ...meUsageResponseSchema.parse(summary),
      dashboard,
    };
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
