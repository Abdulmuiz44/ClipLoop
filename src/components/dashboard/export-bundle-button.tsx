"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ExportBundleButton({
  contentItemId,
  disabled,
}: {
  contentItemId: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function downloadBundle() {
    if (disabled) return;
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/content-items/${contentItemId}/export-bundle`);
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      setError(json.error ?? "Export failed");
      setLoading(false);
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const fileName =
      response.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
      `cliploop-export-${contentItemId.slice(0, 8)}.zip`;

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    setLoading(false);
  }

  return (
    <div>
      <Button type="button" onClick={downloadBundle} disabled={loading || disabled}>
        {loading ? "Exporting..." : "Export bundle"}
      </Button>
      {disabled ? <p className="mt-1 text-xs text-slate-600">Render this item first to export bundle.</p> : null}
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
