"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type TemplateId = "clean_dark" | "bold_light" | "hf_promo_v1";
type RenderBackend = "legacy" | "hyperframes";
type TargetChannel = "instagram" | "tiktok" | "whatsapp";

export function RenderButton({
  endpoint,
  label,
  compact = false,
  initialTargetChannel = "instagram",
  showChannelOverride = false,
}: {
  endpoint: string;
  label: string;
  compact?: boolean;
  initialTargetChannel?: TargetChannel;
  showChannelOverride?: boolean;
}) {
  const [templateId, setTemplateId] = useState<TemplateId>("clean_dark");
  const [renderer, setRenderer] = useState<RenderBackend>("legacy");
  const [targetChannel, setTargetChannel] = useState<TargetChannel>(initialTargetChannel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setLoading(true);
    setError(null);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId,
        renderer,
        ...(showChannelOverride ? { targetChannel } : {}),
      }),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      const limitDetail =
        typeof json.used === "number" && typeof json.limit === "number" ? ` (${json.used}/${json.limit} used)` : "";
      setError(`${json.error ?? "Render failed"}${limitDetail}`);
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className={`space-y-2 ${compact ? "max-w-xs" : ""}`}>
      <select
        value={renderer}
        onChange={(event) => {
          const next = event.target.value as RenderBackend;
          setRenderer(next);
          if (next === "hyperframes") setTemplateId("hf_promo_v1");
          if (next === "legacy" && templateId === "hf_promo_v1") setTemplateId("clean_dark");
        }}
        className="w-full rounded border px-2 py-1 text-sm"
      >
        <option value="legacy">Legacy renderer</option>
        <option value="hyperframes">HyperFrames renderer</option>
      </select>
      <select
        value={templateId}
        onChange={(event) => setTemplateId(event.target.value as TemplateId)}
        className="w-full rounded border px-2 py-1 text-sm"
      >
        {renderer === "legacy" ? (
          <>
            <option value="clean_dark">Clean Dark</option>
            <option value="bold_light">Bold Light</option>
          </>
        ) : (
          <option value="hf_promo_v1">HyperFrames Promo V1</option>
        )}
      </select>
      {showChannelOverride ? (
        <select
          value={targetChannel}
          onChange={(event) => setTargetChannel(event.target.value as TargetChannel)}
          className="w-full rounded border px-2 py-1 text-sm"
        >
          <option value="instagram">Instagram target</option>
          <option value="tiktok">TikTok target</option>
          <option value="whatsapp">WhatsApp target</option>
        </select>
      ) : null}
      <Button type="button" onClick={run} disabled={loading}>
        {loading ? "Rendering..." : label}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
