import type { Metadata } from "next";
import Link from "next/link";
import { AccessRequestForm } from "@/components/marketing/access-request-form";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const pillars = [
  {
    title: "Plan with context",
    body: "ClipLoop ingests your website and business profile, then assembles reusable project context for each cycle.",
  },
  {
    title: "Generate with control",
    body: "Chat-first creation with structured strategy, copy generation, and render controls under one operator surface.",
  },
  {
    title: "Ship and learn",
    body: "Approve assets, push to queue, and iterate from tracked performance data and credit-backed workflows.",
  },
];

const steps = [
  "Capture business context and website signals",
  "Generate strategy and content items for the week",
  "Render short-form assets and review outputs",
  "Export or publish and measure conversions",
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="cl-card relative overflow-hidden p-8 md:p-10">
        <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <p className="cl-kicker">ClipLoop Platform</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">Build weekly growth assets without rebuilding your workflow every week.</h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              ClipLoop is a creative video operating system for businesses and creators: context assembly, planning, generation, rendering, and delivery in one controlled loop.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/app" className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
                Open workspace
              </Link>
              <Link href="/pricing" className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:border-slate-400">
                View pricing
              </Link>
            </div>
          </div>

          <div className="cl-card-soft p-5">
            <p className="text-sm font-semibold text-slate-900">Weekly operator cycle</p>
            <div className="mt-4 space-y-3">
              {steps.map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
                  <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm text-slate-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="cl-card p-5">
            <h2 className="text-base font-semibold text-slate-900">{pillar.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{pillar.body}</p>
          </article>
        ))}
      </section>

      <section className="cl-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="cl-kicker">Open Core Direction</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">First-party app now, open engine plus hosted gateway next.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              ClipLoop is being split into app UX, reusable engine logic, and managed hosted execution for production reliability and credits.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="cl-card-soft p-4">
              <p className="text-sm font-medium text-slate-900">First-party app</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">Dashboard, create flow, chat workspace, onboarding, manual queue.</p>
            </div>
            <div className="cl-card-soft p-4">
              <p className="text-sm font-medium text-slate-900">Open core</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">Context assembly, provider interfaces, render contracts, planning modules.</p>
            </div>
            <div className="cl-card-soft p-4 sm:col-span-2">
              <p className="text-sm font-medium text-slate-900">Hosted gateway</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">Managed API keys, orchestration, provider access, render workers, and credit enforcement.</p>
            </div>
          </div>
        </div>
      </section>

      <AccessRequestForm
        title="Request Access"
        description="ClipLoop is still invite-only for production operators. Share your product use case and we will review for fit."
      />
    </div>
  );
}
