"use client";

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
      setMessage("Thanks — your request is queued. We'll review invites manually during beta.");
    } else {
      const json = await res.json().catch(() => ({}));
      setMessage(json.error ?? "Could not submit request.");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded border bg-white p-6">
      <h1 className="text-2xl font-bold">ClipLoop is currently invite-only</h1>
      <p className="text-sm text-slate-600">
        We are onboarding a limited beta cohort to keep quality high. Request access and we'll follow up via email.
      </p>
      <form action={onSubmit} className="space-y-3">
        <input className="w-full rounded border p-2" value={email} disabled />
        <input name="name" className="w-full rounded border p-2" placeholder="Name" />
        <input name="productName" className="w-full rounded border p-2" placeholder="Product name" />
        <input name="websiteUrl" className="w-full rounded border p-2" placeholder="Website URL" />
        <textarea name="notes" className="w-full rounded border p-2" placeholder="What do you want to use ClipLoop for?" />
        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        <Button disabled={loading} type="submit">
          {loading ? "Submitting..." : "Request beta access"}
        </Button>
      </form>
    </div>
  );
}
