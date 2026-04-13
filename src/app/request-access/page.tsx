import type { Metadata } from "next";
import { AccessRequestForm } from "@/components/marketing/access-request-form";

export const metadata: Metadata = {
  title: "Request Beta Access | ClipLoop",
  description: "Request invite-only beta access to ClipLoop, the weekly short-form growth loop for indie apps and small SaaS products.",
  alternates: { canonical: "/request-access" },
  openGraph: {
    title: "Request Beta Access | ClipLoop",
    description: "Join the invite-only beta for ClipLoop and get reviewed for the $5 starter workflow.",
    url: "/request-access",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Request Beta Access | ClipLoop",
    description: "Invite-only beta for a narrow weekly short-form growth loop.",
  },
};

export default function RequestAccessPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">Invite-only beta</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Request access to ClipLoop</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          ClipLoop is opening carefully. We prioritize indie apps, solo builders, and small SaaS products that want one simple weekly content loop instead of a bloated social media suite.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <p className="font-medium text-slate-950">Best fit</p>
          <p className="mt-2 leading-6 text-slate-600">Indie founders and small SaaS teams that want to turn one product into one weekly short-form pack.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <p className="font-medium text-slate-950">Current starter intent</p>
          <p className="mt-2 leading-6 text-slate-600">$5/month for one active project, hard usage caps, tracked links, and manual iteration.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <p className="font-medium text-slate-950">What happens next</p>
          <p className="mt-2 leading-6 text-slate-600">Requests are reviewed manually. Good-fit products may get beta access before checkout is fully wired.</p>
        </div>
      </div>

      <AccessRequestForm showBackHome />
    </div>
  );
