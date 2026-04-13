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
      canAccessProduct: state.access,
      betaApprovedAt: state.user.betaApprovedAt?.toISOString() ?? null,
      subscription: state.subscription
        ? {
            status: state.subscription.status,
            lemonSqueezySubscriptionId: state.subscription.lemonSqueezySubscriptionId ?? null,
            lemonSqueezyCustomerId: state.subscription.lemonSqueezyCustomerId ?? null,
            lemonSqueezyVariantId: state.subscription.lemonSqueezyVariantId ?? null,
            managementUrl: state.subscription.managementUrl ?? null,
            updatePaymentMethodUrl: state.subscription.updatePaymentMethodUrl ?? null,
            providerStatus: state.subscription.providerStatus ?? null,
            cancelAtPeriodEnd: state.subscription.cancelAtPeriodEnd,
            currentPeriodStart: state.subscription.currentPeriodStart?.toISOString() ?? null,
            currentPeriodEnd: state.subscription.currentPeriodEnd?.toISOString() ?? null,
          }
        : null,
      limits,
    });

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
