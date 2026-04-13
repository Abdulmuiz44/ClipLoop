"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ManageBillingButton({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/billing/portal", { method: "POST" });
    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(json.error ?? "Could not open billing management.");
      setLoading(false);
      return;
    }

    window.location.assign(json.url);
  }

  return (
    <div className={className}>
      <Button type="button" onClick={onClick} disabled={loading}>
        {loading ? "Opening billing..." : "Manage subscription"}
      </Button>
      {message ? <p className="mt-2 text-sm text-rose-700">{message}</p> : null}
    </div>
  );
}
