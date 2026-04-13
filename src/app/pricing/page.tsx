import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | ClipLoop",
  description: "ClipLoop pricing for the invite-only beta: a narrow $5 starter plan for indie apps running one weekly short-form growth loop.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing | ClipLoop",
    description: "See the intended $5 starter plan, current limits, and beta access positioning for ClipLoop.",
    url: "/pricing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | ClipLoop",
    description: "A cheap, opinionated weekly content loop for indie apps and small SaaS products.",
  },
};

function Feature({ children }: { children: React.ReactNode }) {
  return <li className="flex gap-2 leading-6 text-slate-700"><span className="mt-1 h-2 w-2 rounded-full bg-slate-900" />{children}</li>;
}

export default function PricingPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">Pricing</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">A cheap weekly growth loop, intentionally capped</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          ClipLoop is designed around one narrow outcome: generate, render, approve, schedule, track, learn, and repeat every week without turning into a full social media manager.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Starter</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">$5<span className="text-base font-medium text-slate-500">/month</span></h2>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">Invite-only beta</span>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            For one indie app or small SaaS product that wants a fixed weekly short-form loop, not an open-ended content machine.
          </p>

          <ul className="mt-5 space-y-3 text-sm">
            <Feature>1 active project</Feature>
            <Feature>5 generated posts per week</Feature>
            <Feature>20 generated posts per month</Feature>
            <Feature>3 manual regenerations per week</Feature>
            <Feature>20 renders per month</Feature>
            <Feature>20 publishes per month</Feature>
            <Feature>Tracked links, conversions, revenue logging, and weekly performance rollups</Feature>
            <Feature>Manual winner-to-next-cycle iteration flow</Feature>
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/request-access" className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">
              Request beta access
            </Link>
            <Link href="/" className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700">
              See how it works
            </Link>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Beta access</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Early tester access</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Some users may be invited into a beta plan before the starter checkout flow is fully live. Access is approval-based and still subject to the same narrow product shape.
          </p>
          <ul className="mt-5 space-y-3 text-sm">
            <Feature>Best for early adopters who fit the current product shape</Feature>
            <Feature>Invite-only approval based on product fit and current beta capacity</Feature>
            <Feature>May receive temporary beta treatment while the paid starter path is still being finalized</Feature>
          </ul>
        </article>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Good fit</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <Feature>Indie hackers shipping one product</Feature>
            <Feature>Solo founders who want a narrow weekly growth loop</Feature>
            <Feature>Small SaaS teams that need output, not a giant social suite</Feature>
            <Feature>Builders willing to work inside opinionated limits</Feature>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Not a fit</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <Feature>Agencies managing many brands</Feature>
            <Feature>Large social teams with complex collaboration needs</Feature>
            <Feature>Creative studios expecting flexible editing or unlimited generation</Feature>
            <Feature>Anyone looking for fully automated multi-channel publishing today</Feature>
          </ul>
        </div>
      </section>
    </div>
  );
