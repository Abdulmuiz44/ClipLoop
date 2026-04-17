"use client";

import { AccessRequestForm } from "@/components/marketing/access-request-form";
import { StarterCheckoutForm } from "@/components/marketing/starter-checkout-form";

export function AccessGate({ email }: { email: string }) {
  return (
    <div className="cl-card mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Invite-only beta</p>
        <h1 className="text-3xl font-semibold tracking-tight">ClipLoop is onboarding a small cohort</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          ClipLoop is intentionally narrow right now: one product, one channel, one weekly growth loop. We are keeping access tight while we
          harden billing, usage enforcement, and the content workflow.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="cl-card-soft p-3 text-sm">
          <p className="font-medium">What you get</p>
          <p className="mt-1 text-slate-600">Strategy generation, 5 weekly post drafts, rendering, scheduling, tracking, and manual iteration.</p>
        </div>
        <div className="cl-card-soft p-3 text-sm">
          <p className="font-medium">Pro target</p>
          <p className="mt-1 text-slate-600">$5/month for one active project and hard-capped MVP usage.</p>
        </div>
        <div className="cl-card-soft p-3 text-sm">
          <p className="font-medium">Approval flow</p>
          <p className="mt-1 text-slate-600">Request access below. Free chat is available now, and Pro unlocks higher paid-action credits.</p>
        </div>
      </div>

      <StarterCheckoutForm
        email={email}
        showFields={false}
        title="Need paid access instead?"
        description="Pro access no longer needs manual beta approval. Start the real Lemon Squeezy checkout path with the account email already shown here."
      />

      <AccessRequestForm email={email} showBackHome />
    </div>
  );
}
