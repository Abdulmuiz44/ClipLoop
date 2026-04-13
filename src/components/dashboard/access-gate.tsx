"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AccessGate({ email }: { email: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/access/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name: String(formData.get("name") ?? "") || null,
        productName: String(formData.get("productName") ?? "") || null,
        websiteUrl: String(formData.get("websiteUrl") ?? "") || null,
        notes: String(formData.get("notes") ?? "") || null,
      }),
    });

    if (res.ok) {
      setMessage("Access request captured. We review beta invites manually and will follow up by email.");
    } else {
      const json = await res.json().catch(() => ({}));
      setMessage(json.error ?? "Could not submit request.");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 rounded border bg-white p-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Invite-only beta</p>
        <h1 className="text-3xl font-bold">ClipLoop is onboarding a small cohort</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          ClipLoop is intentionally narrow right now: one product, one channel, one weekly growth loop. We are keeping access tight while we
          harden billing, usage enforcement, and the content workflow.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="font-medium">What you get</p>
          <p className="mt-1 text-slate-600">Strategy generation, 5 weekly post drafts, rendering, scheduling, tracking, and manual iteration.</p>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="font-medium">Starter target</p>
          <p className="mt-1 text-slate-600">$5/month for one active project and hard-capped MVP usage.</p>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="font-medium">Approval flow</p>
          <p className="mt-1 text-slate-600">Request access below. Approved beta users and paid starter users unlock the product workflow.</p>
        </div>
      </div>

      <form action={onSubmit} className="space-y-3 rounded border border-slate-200 p-4">
        <h2 className="font-semibold">Request access</h2>
        <input className="w-full rounded border p-2 text-sm" value={email} disabled />
        <div className="grid gap-3 md:grid-cols-2">
          <input name="name" className="w-full rounded border p-2" placeholder="Your name" />
          <input name="productName" className="w-full rounded border p-2" placeholder="Product name" />
        </div>
        <input name="websiteUrl" className="w-full rounded border p-2" placeholder="Website URL" />
        <textarea
          name="notes"
          className="min-h-24 w-full rounded border p-2"
          placeholder="What are you building, and what outcome do you want ClipLoop to help with?"
        />
        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={loading} type="submit">
            {loading ? "Submitting..." : "Request beta access"}
          </Button>
          <Link href="/" className="inline-flex items-center rounded border px-3 py-2 text-sm text-slate-700">
            Back to home
          </Link>
        </div>
      </form>
    </div>
  );
}
