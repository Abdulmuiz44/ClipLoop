"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ActionButton({
  endpoint,
  label,
}: {
  endpoint: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setLoading(true);
    setError(null);
    const response = await fetch(endpoint, { method: "POST" });
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      setError(json.error ?? "Action failed");
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div>
      <Button type="button" onClick={run} disabled={loading}>
        {loading ? "Working..." : label}
      </Button>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
