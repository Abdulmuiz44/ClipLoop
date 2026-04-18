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
      <section className="cl-card p-6 md:p-8">
        <p className="cl-kicker">Checkout cancelled</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">No charge was completed.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          ClipLoop is still available through free chat access and paid Pro credits. If you still want paid access, you can restart checkout any time.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/pricing" className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-700">
          Return to pricing
        </Link>
        <Link href="/request-access" className="inline-flex rounded-xl border px-4 py-2.5 text-sm text-slate-700 transition cl-divider hover:bg-slate-50">
          Request beta access instead
        </Link>
      </div>
    </div>
  );
}
