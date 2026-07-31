import type { Metadata } from "next";
import Link from "next/link";
import { StarterCheckoutForm } from "@/components/marketing/starter-checkout-form";
import { ClipLaneLogo } from "@/components/ui/cliplane-logo";

export const metadata: Metadata = {
  title: "Pricing | ClipLane",
  description: "Free chat for everyone. Credits are consumed for generation and rendering. Upgrade to Pro for higher limits.",
  alternates: { canonical: "/pricing" },
};

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 leading-6 text-slate-700">
      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-600" />
      {children}
    </li>
  );
}

export default function PricingPage() {
  return (
    <div className="space-y-6 md:space-y-8">
      <section className="cl-card p-6 md:p-8">
        <ClipLaneLogo href="/" />
        <p className="cl-kicker">Pricing</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Free chat. Pay for generation and render capacity.</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          ClipLane chat stays free. Credits are consumed when you run promo copy generation and video rendering operations.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="cl-card p-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Free</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">
            $0<span className="text-base font-medium text-slate-500">/month</span>
          </h2>
          <p className="mt-4 text-sm text-slate-600">Best for testing ClipLane with one business profile and light monthly output.</p>
          <ul className="mt-5 space-y-3 text-sm">
            <Feature>Unlimited chat messages</Feature>
            <Feature>1 active project</Feature>
            <Feature>12 generation credits/month</Feature>
            <Feature>6 render credits/month</Feature>
            <Feature>Manual queue and export workflow included</Feature>
          </ul>
          <div className="mt-6">
            <Link href="/app" className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:border-slate-400">
              Start in workspace
            </Link>
          </div>
        </article>

        <article className="cl-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Pro</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                $5<span className="text-base font-medium text-slate-500">/month</span>
              </h2>
            </div>
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white">Best value</span>
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
              className="border-0 bg-transparent p-0"
            />
          </div>
        </article>
      </section>
    </div>
  );
}
