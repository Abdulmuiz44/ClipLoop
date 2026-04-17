import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pro Checkout Cancelled | ClipLoop",
  description: "You left the ClipLoop Pro checkout before payment completed.",
  alternates: { canonical: "/billing/cancel" },
};

export default function BillingCancelPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">Checkout cancelled</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">No charge was completed.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          ClipLoop is still available through free chat access and paid Pro credits. If you still want paid access, you can restart checkout any time.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/pricing" className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-700">
          Return to pricing
        </Link>
        <Link href="/request-access" className="inline-flex rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700">
          Request beta access instead
        </Link>
      </div>
    </div>
  );
}
