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
        <p className="cl-kicker">Account & Billing</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-[2.5rem] text-slate-950">Manage your workspace</h1>
        <p className="text-base leading-7 text-slate-600 max-w-2xl">
          ClipLoop provides a free chat-first workspace for all users. Upgrade to Pro for higher generation and render limits for your brands.
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="cl-card p-6 text-sm">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">Profile status</h2>
          <dl className="mt-5 space-y-3 border-t pt-4 cl-divider">
            <div className="flex items-center justify-between gap-4">
              <dt className="font-medium text-slate-500">Email address</dt>
              <dd className="text-slate-950">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="font-medium text-slate-500">Active plan</dt>
              <dd className="font-bold text-slate-950 uppercase tracking-wider">{getDisplayPlanName(state.effectivePlan)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="font-medium text-slate-500">Access state</dt>
              <dd className={`font-semibold ${state.access ? "text-emerald-600" : "text-rose-600"}`}>{state.access ? "Active" : "Restricted"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="font-medium text-slate-500">Beta status</dt>
              <dd className="text-slate-700">{state.isBetaApproved ? "Approved" : "Pending"}</dd>
            </div>
          </dl>
        </div>

        <div className="cl-card p-6 text-sm">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">Subscription</h2>
          {state.subscription ? (
            <div className="mt-5 space-y-5 border-t pt-4 cl-divider">
              <dl className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-medium text-slate-500">Status</dt>
                  <dd className="font-semibold text-slate-950 capitalize">{state.subscription.status}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-medium text-slate-500">Billing Provider</dt>
                  <dd className="text-slate-700">Lemon Squeezy</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-medium text-slate-500">Current Period</dt>
                  <dd className="text-slate-700">
                    {state.subscription.currentPeriodStart ? new Date(state.subscription.currentPeriodStart).toLocaleDateString() : "n/a"} -{" "}
                    {state.subscription.currentPeriodEnd ? new Date(state.subscription.currentPeriodEnd).toLocaleDateString() : "n/a"}
                  </dd>
                </div>
              </dl>

              <div className="rounded-xl bg-slate-50 p-4 border cl-divider">
                <p className="text-xs leading-relaxed text-slate-600">
                  {state.effectivePlan === "starter"
                    ? "Your Pro subscription is active. You can manage payment methods, download invoices, or cancel via the billing portal."
                    : "Subscription record found. Plan resolution is synced with your provider status."}
                </p>
                <div className="mt-4">
                  <ManageBillingButton />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 border-t pt-4 cl-divider">
              <StarterCheckoutForm
                email={user.email}
                name={user.fullName ?? ""}
                showFields={false}
                title="Upgrade to Pro"
                description="Unlock higher generation and render credits for your weekly promo loops."
                submitLabel="Start Pro checkout"
                className="mt-0"
              />
            </div>
          )}
        </div>
      </section>

      <section className="cl-card p-6 text-sm">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">Plan details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 border-t pt-5 cl-divider">
          <div className="cl-card-soft p-4">
             <p className="font-semibold text-slate-950 mb-1">Free</p>
             <p className="text-xs text-slate-600 leading-relaxed">Basic generation for one brand. Unlimited chat strategy.</p>
          </div>
          <div className="cl-card-soft p-4">
             <p className="font-semibold text-slate-950 mb-1">Pro</p>
             <p className="text-xs text-slate-600 leading-relaxed">Higher limits for multiple channels and batch rendering.</p>
          </div>
          <div className="cl-card-soft p-4">
             <p className="font-semibold text-slate-950 mb-1">Custom</p>
             <p className="text-xs text-slate-600 leading-relaxed">High-volume export needs for larger creator teams.</p>
          </div>
        </div>
      </section>

      <UsageSummary
        usage={usage.usage}
        limits={usage.limits}
        remaining={usage.remaining}
        title="Credit usage"
        subtitle={`Current usage windows: Weekly (${usage.periods.week.start} to ${usage.periods.week.end}) and Monthly (${usage.periods.month.start} to ${usage.periods.month.end}).`}
      />

      <section className="cl-card p-6 text-sm">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4 cl-divider">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">Credit history</h2>
            <p className="mt-1 text-slate-600">
              Detailed ledger of generation and render actions for the current period.
            </p>
          </div>
          <div className="flex gap-4 rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider cl-divider bg-slate-50">
            <p className="text-slate-500">
              Generation: <span className="text-slate-950">{ledger.wallet.generationBalance}</span>
            </p>
            <p className="text-slate-500">
              Render: <span className="text-slate-950">{ledger.wallet.renderBalance}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <tr className="border-b cl-divider">
                <th className="pb-3 pr-3">Time</th>
                <th className="pb-3 pr-3">Action</th>
                <th className="pb-3 pr-3">Bucket</th>
                <th className="pb-3 pr-3">Amount</th>
                <th className="pb-3 pr-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y cl-divider">
              {ledger.transactions.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-3 pr-3 text-slate-500">{entry.createdAt.toISOString().replace("T", " ").slice(0, 16)}</td>
                  <td className="py-3 pr-3 font-medium text-slate-900">{formatCreditReason(entry.reason)}</td>
                  <td className="py-3 pr-3 uppercase text-[10px] font-bold text-slate-500">{entry.bucket}</td>
                  <td className={`py-3 pr-3 font-bold ${entry.amountDelta < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                    {entry.amountDelta > 0 ? `+${entry.amountDelta}` : entry.amountDelta}
                  </td>
                  <td className="py-3 pr-3 text-right font-medium text-slate-950">{entry.balanceAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ledger.transactions.length === 0 ? (
            <div className="py-12 text-center">
               <p className="text-xs text-slate-400 italic">No credit transactions recorded yet.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
