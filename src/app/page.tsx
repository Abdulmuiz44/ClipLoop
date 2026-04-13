import type { Metadata } from "next";
import Link from "next/link";
import { AccessRequestForm } from "@/components/marketing/access-request-form";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const weeklyPack = [
  {
    title: "Post 1",
    hook: "Still marketing your app from a blank page every Monday?",
    slides: ["Call out the pain", "Frame the shift", "Show the weekly loop", "Push the CTA"],
    caption: "ClipLoop turns one product into one sharp weekly short-form pack.",
    metrics: "42 clicks · 7 signups · $49 revenue",
  },
  {
    title: "Post 2",
    hook: "Most indie SaaS content dies because the loop is inconsistent.",
    slides: ["Why consistency breaks", "What gets generated", "Where tracked links fit", "What to test next week"],
    caption: "Generate, render, approve, schedule, track, learn, repeat.",
    metrics: "31 clicks · 4 signups · winner",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-[1.15fr_0.85fr] md:p-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Invite-only beta</p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
              Short-form growth automation for indie apps.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              ClipLoop gives you one weekly growth loop: add your app, generate the week, render and approve the posts, schedule the pack, track what converts, then build the next week from the winners.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/request-access" className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-700">
              Request beta access
            </Link>
            <Link href="/pricing" className="inline-flex rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700">
              View pricing
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-950">Cheap and narrow</p>
              <p className="mt-2 leading-6 text-slate-600">$5 starter intent, one project, hard caps, one clear weekly loop.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-950">Grounded in the real product</p>
              <p className="mt-2 leading-6 text-slate-600">Generated posts, rendering, scheduling, tracked links, and manual winner-based iteration already exist.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-950">Invite-only for now</p>
              <p className="mt-2 leading-6 text-slate-600">Beta access is reviewed manually while billing and product fit harden.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Weekly pack preview</p>
              <h2 className="mt-1 text-2xl font-semibold">What users actually get</h2>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">5 posts / week</span>
          </div>
          <div className="mt-5 space-y-4">
            {weeklyPack.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.title}</p>
                <p className="mt-2 text-base font-semibold">{item.hook}</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-300">
                  {item.slides.map((slide) => (
                    <li key={slide}>• {slide}</li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-slate-300">{item.caption}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-300">Tracked link</span>
                  <span className="rounded-full bg-blue-500/15 px-2 py-1 text-blue-300">{item.metrics}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        {[
          ["1. Add your app", "Store product context, offer, CTA, and voice notes once."],
          ["2. Generate the week", "Create one strategy cycle and a batch of 5 short-form post drafts."],
          ["3. Render and approve", "Turn drafts into simple vertical slideshow videos, then keep the ones you want."],
          ["4. Schedule and publish", "Use the current mock publish flow and tracked links to ship the pack."],
          ["5. Learn and repeat", "Roll up clicks, signups, and revenue, then generate the next cycle from winners."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">What you get each week</p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
            <li>5 short-form promo posts built from your product context</li>
            <li>Hooks, slides, captions, CTAs, and tracked destination links</li>
            <li>Rendered MP4 previews and approval before scheduling</li>
            <li>Simple click, signup, and revenue feedback once posts are in market</li>
            <li>Manual next-cycle generation informed by winners and losers</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">Why ClipLoop</p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
            <li>It is opinionated on purpose. One project, one weekly pack, one simple loop.</li>
            <li>It is cheap by design. Starter is positioned around a $5 monthly workflow, not a giant platform tax.</li>
            <li>It focuses on outcomes. Generate, ship, track, learn, repeat.</li>
            <li>It is not pretending to be a bloated social media suite or creative studio.</li>
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">Built for</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Indie builders who need a repeatable weekly loop</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              ClipLoop is for indie hackers, SaaS founders, solo builders, and app creators who want distribution without manually planning, writing, rendering, and testing content every week.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
            <p className="font-medium text-slate-950">Not a fit</p>
            <ul className="mt-3 space-y-2 leading-6">
              <li>Agencies managing many brands</li>
              <li>Large social teams with collaboration needs</li>
              <li>Anyone expecting unlimited AI generation or custom creative tooling</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-sm md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">Starter pricing</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">$5/month, intentionally capped</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            One active project. Five posts per week. Hard monthly limits. Invite-only beta until the checkout path is ready for broader use.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/pricing" className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm text-slate-950 hover:bg-slate-200">
              See pricing details
            </Link>
            <Link href="/request-access" className="inline-flex rounded-xl border border-white/20 px-4 py-2.5 text-sm text-white hover:bg-white/10">
              Request access
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium">What happens after approval</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              <li>Set up one product</li>
              <li>Generate the first weekly strategy</li>
              <li>Create and review the 5-post pack</li>
              <li>Render, approve, schedule, publish, track</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium">What improves over time</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              <li>Winners and losers get classified</li>
              <li>Hooks and angles get mutated</li>
              <li>Next week is generated from results</li>
              <li>The loop stays simple and inspectable</li>
            </ul>
          </div>
        </div>
      </section>

      <AccessRequestForm
        title="Join the invite-only beta"
        description="If your product fits the current ClipLoop shape, request access here. We review manually and prioritize clear, narrow use cases over broad marketing wishlists."
      />
    </div>
  );
}
