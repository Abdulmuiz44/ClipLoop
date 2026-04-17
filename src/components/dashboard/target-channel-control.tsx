"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type TargetChannel = "instagram" | "tiktok" | "whatsapp";

export function TargetChannelControl({
  contentItemId,
  value,
}: {
  contentItemId: string;
  value: TargetChannel;
}) {
  const router = useRouter();
  const [targetChannel, setTargetChannel] = useState<TargetChannel>(value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/content-items/${contentItemId}/target-channel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetChannel }),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      setError(json.error ?? "Failed to update channel");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <select
        value={targetChannel}
        onChange={(event) => setTargetChannel(event.target.value as TargetChannel)}
        className="w-full rounded border px-2 py-1 text-sm"
      >
        <option value="instagram">Instagram</option>
        <option value="tiktok">TikTok</option>
        <option value="whatsapp">WhatsApp</option>
      </select>
      <Button type="button" onClick={save} disabled={loading}>
        {loading ? "Updating..." : "Set target channel"}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
