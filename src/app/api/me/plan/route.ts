import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPlanLimitsForUser, getUserPlanState } from "@/domains/account/service";
import { mePlanResponseSchema } from "@/lib/validation/billing";
import { toErrorResponse } from "@/lib/http/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const state = await getUserPlanState(user.id);
    const limits = await getPlanLimitsForUser(user.id);

    const payload = mePlanResponseSchema.parse({
      plan: state.effectivePlan,
      billingStatus: state.billingStatus,
      betaApproved: state.isBetaApproved,
      inviteOnlyMode: state.inviteOnlyMode,
      limits,
    });

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
