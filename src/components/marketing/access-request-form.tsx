"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type AccessRequestFormProps = {
  email?: string;
  title?: string;
  description?: string;
  showBackHome?: boolean;
  className?: string;
};

export function AccessRequestForm({
  email = "",
  title = "Request beta access",
  description = "ClipLoop is invite-only in beta. We review requests manually and prioritize indie apps, solo builders, and small SaaS products that fit the current weekly loop.",
  showBackHome = false,
  className = "",
}: AccessRequestFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const resolvedEmail = String(formData.get("email") ?? email).trim();
    const response = await fetch("/api/access/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: resolvedEmail,
        name: String(formData.get("name") ?? "") || null,
        productName: String(formData.get("productName") ?? "") || null,
        websiteUrl: String(formData.get("websiteUrl") ?? "") || null,
        notes: String(formData.get("notes") ?? "") || null,
      }),
    });

    const json = await response.json().catch(() => ({}));

    if (response.ok) {
      setMessage(
        "Request received. ClipLoop is invite-only in beta, and we review fit manually. Strong fits today are indie apps, solo builders, and small SaaS products running one narrow weekly growth loop.",
      );
    } else {
      setMessage(json.error ?? "Could not submit request.");
    }

    setLoading(false);
  }

  return (
    <form action={onSubmit} className={`cl-card space-y-4 p-5 ${className}`}>
      <div>
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Email</span>
          <input
            name="email"
            type="email"
            defaultValue={email}
            placeholder="you@yourapp.com"
            className="cl-input"
            required
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Name</span>
          <input name="name" placeholder="Your name" className="cl-input" />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Product name</span>
          <input name="productName" placeholder="Acme Analytics" className="cl-input" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Website URL</span>
          <input name="websiteUrl" placeholder="https://yourapp.com" className="cl-input" />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">What are you building?</span>
        <textarea
          name="notes"
          className="cl-textarea min-h-28"
          placeholder="Tell us what your product does, who it serves, and what you want ClipLoop to help with."
        />
      </label>

      {message ? <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button disabled={loading} type="submit">
          {loading ? "Submitting..." : "Request beta access"}
        </Button>
        {showBackHome ? (
          <Link href="/" className="inline-flex items-center rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Back to home
          </Link>
        ) : null}
      </div>
    </form>
  );
}
