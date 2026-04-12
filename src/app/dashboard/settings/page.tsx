import { getCurrentUser } from "@/lib/auth";
import { getUserPlanState } from "@/domains/account/service";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const state = await getUserPlanState(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Account & Billing</h1>
      <section className="rounded border bg-white p-4 text-sm">
        <p>Email: {user.email}</p>
        <p>Plan: {state.effectivePlan}</p>
        <p>Billing status: {state.billingStatus}</p>
        <p>Beta approved: {state.isBetaApproved ? "yes" : "no"}</p>
        <p>Stripe subscription ID: {state.subscription?.stripeSubscriptionId ?? "not connected"}</p>
        <p>Stripe price ID: {state.subscription?.stripePriceId ?? "not connected"}</p>
      </section>
      <section className="rounded border bg-white p-4 text-sm text-slate-700">
        Starter checkout is intentionally lightweight in this MVP slice. Subscription records are persisted and ready for
        Stripe wiring in a follow-up.
      </section>
    </div>
  );
}
