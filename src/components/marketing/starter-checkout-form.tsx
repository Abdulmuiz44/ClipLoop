"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type StarterCheckoutFormProps = {
  email?: string;
  name?: string;
  title?: string;
  description?: string;
  showFields?: boolean;
  submitLabel?: string;
  className?: string;
};

export function StarterCheckoutForm({
  email = "",
  name = "",
  title = "Start Pro checkout",
  description = "Use the email tied to your ClipLoop account. Pro access is granted by webhook sync after Lemon Squeezy confirms the subscription.",
  showFields = true,
  submitLabel = "Start Pro checkout",
  className = "",
}: StarterCheckoutFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(formData.get("email") ?? email).trim() || null,
        name: String(formData.get("name") ?? name).trim() || null,
      }),
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(json.error ?? "Could not start checkout.");
      setLoading(false);
      return;
    }

    window.location.assign(json.url);
  }

  return (
    <form action={onSubmit} className={`space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div>
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      {showFields ? (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              name="email"
              type="email"
              defaultValue={email}
              placeholder="you@yourapp.com"
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Name</span>
            <input name="name" defaultValue={name} placeholder="Your name" className="w-full rounded-xl border border-slate-300 px-3 py-2" />
          </label>
        </div>
      ) : null}

      {message ? <p className="rounded-xl bg-rose-50 px-3 py-3 text-sm text-rose-700">{message}</p> : null}

      <Button disabled={loading} type="submit">
        {loading ? "Opening checkout..." : submitLabel}
      </Button>
    </form>
  );
}
