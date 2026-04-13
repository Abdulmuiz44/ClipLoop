import { getCurrentUser } from "@/lib/auth";
import { getCurrentUsageSummary, getUserPlanState } from "@/domains/account/service";
import { UsageSummary } from "@/components/dashboard/usage-summary";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const state = await getUserPlanState(user.id);
  const usage = await getCurrentUsageSummary(user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Account and billing</p>
        <h1 className="text-3xl font-bold">Starter-ready account state</h1>
        <p className="text-sm text-slate-600">Billing is still intentionally lightweight in this MVP, but the account model, subscription record, and plan-aware limits are in place.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded border bg-white p-4 text-sm">
          <h2 className="font-semibold">Account status</h2>
          <dl className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Effective plan</dt>
              <dd>{state.effectivePlan}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Billing status</dt>
              <dd>{state.billingStatus}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Invite-only mode</dt>
              <dd>{state.inviteOnlyMode ? "enabled" : "disabled"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Product access</dt>
              <dd>{state.access ? "allowed" : "blocked"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Beta approval</dt>
              <dd>{state.isBetaApproved ? `approved${state.user.betaApprovedAt ? ` on ${state.user.betaApprovedAt.toISOString().slice(0, 10)}` : ""}` : "not approved"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded border bg-white p-4 text-sm">
          <h2 className="font-semibold">Subscription record</h2>
          {state.subscription ? (
            <dl className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Status</dt>
                <dd>{state.subscription.status}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Stripe subscription ID</dt>
                <dd>{state.subscription.stripeSubscriptionId ?? "not connected"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Stripe price ID</dt>
                <dd>{state.subscription.stripePriceId ?? "not connected"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Current period</dt>
                <dd>
                  {state.subscription.currentPeriodStart ? state.subscription.currentPeriodStart.toISOString().slice(0, 10) : "n/a"} to{" "}
                  {state.subscription.currentPeriodEnd ? state.subscription.currentPeriodEnd.toISOString().slice(0, 10) : "n/a"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Cancel at period end</dt>
                <dd>{state.subscription.cancelAtPeriodEnd ? "yes" : "no"}</dd>
              </div>
            </dl>
          ) : (
            <div className="mt-3 rounded border border-dashed border-slate-300 bg-slate-50 p-3 text-slate-600">
              No live checkout flow yet. This project stores subscription state so starter access can be wired to Stripe cleanly in the next phase.
            </div>
          )}
        </div>
      </section>

      <UsageSummary
        usage={usage.usage}
        limits={usage.limits}
        remaining={usage.remaining}
        title="Starter usage envelope"
        subtitle={`Week window ${usage.periods.week.start} to ${usage.periods.week.end}. Month window ${usage.periods.month.start} to ${usage.periods.month.end}.`}
      />
    </div>
  );
}
