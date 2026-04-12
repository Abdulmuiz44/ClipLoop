"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RunJobsButton() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function runJobs() {
    setLoading(true);
    setError(null);
    setSummary(null);

    const response = await fetch("/api/jobs/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 20 }),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(json.error ?? "Failed to run jobs");
      setLoading(false);
      return;
    }

    setSummary(`Processed ${json.processed} jobs (successes: ${json.successes}, failures: ${json.failures})`);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={runJobs} disabled={loading}>
        {loading ? "Running..." : "Run due jobs now"}
      </Button>
      {summary ? <p className="text-sm text-emerald-700">{summary}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
