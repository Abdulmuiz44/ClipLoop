"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ScheduleItemControl({ endpoint }: { endpoint: string }) {
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function schedule() {
    if (!scheduledFor) {
      setError("Choose a schedule date/time first");
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledFor: new Date(scheduledFor).toISOString() }),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      setError(json.error ?? "Scheduling failed");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <input
        type="datetime-local"
        value={scheduledFor}
        onChange={(event) => setScheduledFor(event.target.value)}
        className="w-full rounded border px-2 py-1 text-sm"
      />
      <Button type="button" onClick={schedule} disabled={loading}>
        {loading ? "Scheduling..." : "Schedule post"}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
