import type { Metadata } from "next";
import Link from "next/link";
import { StarterCheckoutForm } from "@/components/marketing/starter-checkout-form";

export const metadata: Metadata = {
  title: "Pricing | ClipLoop",
  description: "Free chat for everyone. Credits are consumed for generation and rendering. Upgrade to Pro for higher limits.",
  alternates: { canonical: "/pricing" },
};

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 leading-6 text-slate-700">
      <span className="mt-1 h-2 w-2 rounded-full bg-slate-900" />
      {children}
    </li>
  );
}

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">Pricing</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Free chat. Pay for generation and render capacity.</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          ClipLoop chat stays free. Credits are consumed when you run promo copy generation and video rendering operations.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Free</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">
            $0<span className="text-base font-medium text-slate-500">/month</span>
          </h2>
          <p className="mt-4 text-sm text-slate-600">Best for testing ClipLoop with one business profile and light monthly output.</p>
          <ul className="mt-5 space-y-3 text-sm">
            <Feature>Unlimited chat messages</Feature>
            <Feature>1 active project</Feature>
            <Feature>12 generation credits/month</Feature>
            <Feature>6 render credits/month</Feature>
            <Feature>Manual queue and export workflow included</Feature>
          </ul>
          <div className="mt-6">
            <Link href="/app" className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Start in workspace
            </Link>
          </div>
        </article>

        <article className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Pro</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">
                $5<span className="text-base font-medium text-slate-500">/month</span>
              </h2>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">Best value</span>
          </div>

          <p className="mt-4 text-sm text-slate-600">For operators who need higher generation/render throughput and multiple active projects.</p>
          <ul className="mt-5 space-y-3 text-sm">
            <Feature>Unlimited chat messages</Feature>
            <Feature>Up to 5 active projects</Feature>
            <Feature>80 generation credits/month</Feature>
            <Feature>40 render credits/month</Feature>
            <Feature>Priority credit envelope for weekly campaigns</Feature>
          </ul>

          <div className="mt-6">
            <StarterCheckoutForm
              title="Upgrade to Pro"
              description="Internal billing identifiers still use starter for compatibility. User-facing plan is Pro."
              submitLabel="Start Pro checkout"
              className="border-0 bg-slate-50 p-0 shadow-none"
            />
          </div>
        </article>
      </section>
    </div>
  );
}
