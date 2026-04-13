import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Starter Checkout Submitted | ClipLoop",
  description: "Your ClipLoop Starter checkout finished. We are waiting for Lemon Squeezy webhook confirmation to sync access.",
  alternates: { canonical: "/billing/success" },
};

export default function BillingSuccessPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-emerald-700">Starter checkout complete</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Payment received. Starter access should sync in a moment.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Lemon Squeezy webhooks are the source of truth for billing in ClipLoop. Once the subscription event lands, your account moves into
          Starter access automatically.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <p className="font-medium text-slate-950">What changed</p>
          <p className="mt-2 leading-6 text-slate-600">Paid Starter access grants the existing weekly workflow without requiring beta approval.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <p className="font-medium text-slate-950">Starter limits</p>
          <p className="mt-2 leading-6 text-slate-600">One active project, five posts per week, twenty posts per month, and the current hard render/publish caps.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <p className="font-medium text-slate-950">Best next step</p>
          <p className="mt-2 leading-6 text-slate-600">Open the dashboard or settings page to confirm your billing state, then create or resume your single project loop.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard" className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-700">
          Go to dashboard
        </Link>
        <Link href="/dashboard/settings" className="inline-flex rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700">
          Review billing state
        </Link>
      </div>
    </div>
  );
}
