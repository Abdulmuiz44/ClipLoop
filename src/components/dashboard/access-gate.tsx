"use client";

import { AccessRequestForm } from "@/components/marketing/access-request-form";
import { StarterCheckoutForm } from "@/components/marketing/starter-checkout-form";

export function AccessGate({ email }: { email: string }) {
  return (
    <div className="cl-card mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="space-y-3">
        <p className="cl-kicker uppercase tracking-widest text-slate-500 font-bold">Invite-only beta</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">ClipLoop is currently in limited access</h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          We are manually onboarding brands, businesses, and creators to ensure the content engine and rendering pipeline remain high-quality for every user.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="cl-card-soft p-4 text-sm leading-relaxed">
          <p className="font-semibold text-slate-950">What you get</p>
          <p className="mt-1 text-slate-600">Weekly strategy, 5 generated post drafts, automated rendering, and conversion tracking.</p>
        </div>
        <div className="cl-card-soft p-4 text-sm leading-relaxed">
          <p className="font-semibold text-slate-950">Pro access</p>
          <p className="mt-1 text-slate-600">Upgrade for higher generation and render credits, plus direct publishing to supported channels.</p>
        </div>
        <div className="cl-card-soft p-4 text-sm leading-relaxed">
          <p className="font-semibold text-slate-950">Waitlist</p>
          <p className="mt-1 text-slate-600">Request access below. We prioritize brands with clear use cases and active social presence.</p>
        </div>
      </div>

      <div className="border-t pt-6 cl-divider">
        <StarterCheckoutForm
          email={email}
          showFields={false}
          title="Instant Pro Upgrade"
          description="Skip the manual beta queue by upgrading to Pro. This unlocks paid credits and higher usage limits immediately."
        />
      </div>

      <div className="border-t pt-6 cl-divider">
        <AccessRequestForm email={email} showBackHome />
      </div>
    </div>
  );
}
