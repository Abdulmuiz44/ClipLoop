"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type TemplateId = "clean_dark" | "bold_light";

export function RenderButton({
  endpoint,
  label,
  compact = false,
}: {
  endpoint: string;
  label: string;
  compact?: boolean;
}) {
  const [templateId, setTemplateId] = useState<TemplateId>("clean_dark");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setLoading(true);
    setError(null);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId }),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      setError(json.error ?? "Render failed");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className={`space-y-2 ${compact ? "max-w-xs" : ""}`}>
      <select
        value={templateId}
        onChange={(event) => setTemplateId(event.target.value as TemplateId)}
        className="w-full rounded border px-2 py-1 text-sm"
      >
        <option value="clean_dark">Clean Dark</option>
        <option value="bold_light">Bold Light</option>
      </select>
      <Button type="button" onClick={run} disabled={loading}>
        {loading ? "Rendering..." : label}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
