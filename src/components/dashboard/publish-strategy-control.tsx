"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type PublishStrategy = "direct_instagram" | "direct_telegram" | "manual_export";

export function PublishStrategyControl({
  contentItemId,
  targetChannel,
  value,
}: {
  contentItemId: string;
  targetChannel: "instagram" | "tiktok" | "whatsapp" | "telegram";
  value: PublishStrategy;
}) {
  const router = useRouter();
  const [publishStrategy, setPublishStrategy] = useState<PublishStrategy>(value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUseDirectInstagram = targetChannel === "instagram";
  const canUseDirectTelegram = targetChannel === "telegram";

  async function save() {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/content-items/${contentItemId}/publish-strategy`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publishStrategy }),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      setError(json.error ?? "Failed to update publish strategy");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <select
        value={publishStrategy}
        onChange={(event) => setPublishStrategy(event.target.value as PublishStrategy)}
        className="w-full rounded border px-2 py-1 text-sm"
      >
        {canUseDirectInstagram ? <option value="direct_instagram">Direct Instagram</option> : null}
        {canUseDirectTelegram ? <option value="direct_telegram">Direct Telegram</option> : null}
        <option value="manual_export">Manual Export</option>
      </select>
      <Button type="button" onClick={save} disabled={loading}>
        {loading ? "Updating..." : "Set publish strategy"}
      </Button>
      {!canUseDirectInstagram && !canUseDirectTelegram ? <p className="text-xs text-slate-600">This channel is manual export-only.</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
