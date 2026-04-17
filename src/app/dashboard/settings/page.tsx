import { getCurrentUser } from "@/lib/auth";
import { getCurrentUsageSummary, getUserPlanState } from "@/domains/account/service";
import { UsageSummary } from "@/components/dashboard/usage-summary";
import { ManageBillingButton } from "@/components/dashboard/manage-billing-button";
import { StarterCheckoutForm } from "@/components/marketing/starter-checkout-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const state = await getUserPlanState(user.id);
  const usage = await getCurrentUsageSummary(user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Account and billing</p>
        <h1 className="text-3xl font-bold">Billing and access state</h1>
        <p className="text-sm text-slate-600">ClipLoop keeps billing intentionally narrow: free trial access includes one project, and Starter unlocks multi-project usage through Lemon Squeezy billing.</p>
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
            <div className="mt-3 space-y-4">
              <dl className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Status</dt>
                  <dd>{state.subscription.status}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Lemon subscription ID</dt>
                  <dd>{state.subscription.lemonSqueezySubscriptionId ?? "not connected"}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Lemon customer ID</dt>
                  <dd>{state.subscription.lemonSqueezyCustomerId ?? "not connected"}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Variant ID</dt>
                  <dd>{state.subscription.lemonSqueezyVariantId ?? "not connected"}</dd>
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

              <p className="text-slate-600">
                {state.effectivePlan === "starter"
                  ? "Starter access is active through Lemon Squeezy. Use the management link below to update payment details or cancel."
                  : "A subscription record exists, but ClipLoop currently resolves your effective plan from the synced status above."}
              </p>

              <ManageBillingButton />
            </div>
          ) : (
            <StarterCheckoutForm
              email={user.email}
              name={user.fullName ?? ""}
              showFields={false}
              title="Upgrade to Starter"
              description="Paid Starter access unlocks the same weekly ClipLoop workflow without needing manual beta approval."
              submitLabel="Start Starter checkout"
              className="mt-3"
            />
          )}
        </div>
      </section>

      <section className="rounded border bg-white p-5 text-sm">
        <h2 className="font-semibold">How access is decided</h2>
        <ul className="mt-3 space-y-2 text-slate-600">
          <li>All users can start on the free plan with one active project.</li>
          <li>Paid Starter access comes from the synced Lemon Squeezy subscription state.</li>
          <li>Upgrade to Starter when you need more than one active project.</li>
        </ul>
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
