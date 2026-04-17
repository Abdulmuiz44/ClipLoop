import { getCurrentUser } from "@/lib/auth";
import { getCurrentUsageSummary, getDisplayPlanName, getUserPlanState } from "@/domains/account/service";
import { UsageSummary } from "@/components/dashboard/usage-summary";
import { ManageBillingButton } from "@/components/dashboard/manage-billing-button";
import { StarterCheckoutForm } from "@/components/marketing/starter-checkout-form";
import { formatCreditReason, getCreditWalletWithRecentTransactions } from "@/domains/credits/service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const state = await getUserPlanState(user.id);
  const [usage, ledger] = await Promise.all([getCurrentUsageSummary(user.id), getCreditWalletWithRecentTransactions(user.id)]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Account and billing</p>
        <h1 className="text-3xl font-semibold tracking-tight">Billing and access state</h1>
        <p className="text-sm leading-6 text-slate-600">ClipLoop keeps billing intentionally narrow: free chat + capped credits, with Pro unlocking higher generation and render capacity.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="cl-card p-5 text-sm">
          <h2 className="font-semibold">Account status</h2>
          <dl className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Effective plan</dt>
              <dd>{getDisplayPlanName(state.effectivePlan)}</dd>
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

        <div className="cl-card p-5 text-sm">
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
                  ? "Pro access is active through Lemon Squeezy. Use the management link below to update payment details or cancel."
                  : "A subscription record exists, but ClipLoop currently resolves your effective plan from the synced status above."}
              </p>

              <ManageBillingButton />
            </div>
          ) : (
            <StarterCheckoutForm
              email={user.email}
              name={user.fullName ?? ""}
              showFields={false}
              title="Upgrade to Pro"
              description="Pro increases your generation/render credits while chat remains free."
              submitLabel="Start Pro checkout"
              className="mt-3"
            />
          )}
        </div>
      </section>

      <section className="cl-card p-5 text-sm">
        <h2 className="font-semibold">How access is decided</h2>
        <ul className="mt-3 space-y-2 text-slate-600">
          <li>All users can start on the free plan with one active project.</li>
          <li>Paid Pro access comes from the synced Lemon Squeezy subscription state.</li>
          <li>Upgrade to Pro for more projects and higher generation/render credits.</li>
        </ul>
      </section>

      <UsageSummary
        usage={usage.usage}
        limits={usage.limits}
        remaining={usage.remaining}
        title="Credit usage envelope"
        subtitle={`Week window ${usage.periods.week.start} to ${usage.periods.week.end}. Month window ${usage.periods.month.start} to ${usage.periods.month.end}.`}
      />

      <section className="cl-card p-5 text-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">Credit ledger</h2>
            <p className="mt-1 text-slate-600">
              Durable credit accounting source of truth. Monthly grant period: <strong>{ledger.wallet.periodKey}</strong>.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <p>
              Generation balance: <strong>{ledger.wallet.generationBalance}</strong>
            </p>
            <p>
              Render balance: <strong>{ledger.wallet.renderBalance}</strong>
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="text-slate-500">
              <tr className="border-b">
                <th className="py-2 pr-3">Time</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Bucket</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Balance after</th>
              </tr>
            </thead>
            <tbody>
              {ledger.transactions.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="py-2 pr-3 text-slate-600">{entry.createdAt.toISOString().replace("T", " ").slice(0, 16)} UTC</td>
                  <td className="py-2 pr-3">{formatCreditReason(entry.reason)}</td>
                  <td className="py-2 pr-3 capitalize">{entry.bucket}</td>
                  <td className={`py-2 pr-3 font-medium ${entry.amountDelta < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                    {entry.amountDelta > 0 ? `+${entry.amountDelta}` : entry.amountDelta}
                  </td>
                  <td className="py-2 pr-3">{entry.balanceAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ledger.transactions.length === 0 ? (
            <p className="pt-3 text-xs text-slate-500">No transactions yet. Paid generation/render actions will appear here.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
