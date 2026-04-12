"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BulkScheduleControl({ endpoint }: { endpoint: string }) {
  const [startAt, setStartAt] = useState("");
  const [spacingHours, setSpacingHours] = useState(24);
  const [onlyApproved, setOnlyApproved] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function scheduleAll() {
    if (!startAt) {
      setError("Pick a start date/time");
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startAt: new Date(startAt).toISOString(),
        spacingHours,
        onlyApproved,
      }),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      setError(json.error ?? "Bulk schedule failed");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="grid gap-2 md:grid-cols-4">
      <input
        type="datetime-local"
        value={startAt}
        onChange={(event) => setStartAt(event.target.value)}
        className="rounded border px-2 py-1 text-sm"
      />
      <input
        type="number"
        min={1}
        max={168}
        value={spacingHours}
        onChange={(event) => setSpacingHours(Number(event.target.value))}
        className="rounded border px-2 py-1 text-sm"
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={onlyApproved} onChange={(event) => setOnlyApproved(event.target.checked)} />
        Only approved
      </label>
      <Button type="button" onClick={scheduleAll} disabled={loading}>
        {loading ? "Scheduling..." : "Schedule all"}
      </Button>
      {error ? <p className="text-sm text-red-600 md:col-span-4">{error}</p> : null}
    </div>
  );
}
