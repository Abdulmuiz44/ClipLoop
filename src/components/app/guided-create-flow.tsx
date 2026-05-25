"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useMemo, useState } from "react";

type Brief = {
  targetChannel: "instagram" | "tiktok" | "whatsapp";
  tone: string;
  cta: string;
  duration: string;
  stylePreset: string;
  captionHint: string;
  prompt: string;
};

type ResultData = {
  videoUrl: string | null;
  downloadUrl: string | null;
  caption: string;
  ctaText: string;
  targetChannel: string;
  creditsConsumed: number | null;
};

const VIDEO_CREDIT_COST = 2;

function makeBrief(prompt: string): Brief {
  const lower = prompt.toLowerCase();
  const targetChannel = lower.includes("tiktok") ? "tiktok" : lower.includes("whatsapp") ? "whatsapp" : "instagram";
  return {
    targetChannel,
    tone: "confident, clear, conversion-focused",
    cta: "Tap to learn more",
    duration: "15s",
    stylePreset: "clean premium",
    captionHint: "Short, direct, creator-friendly",
    prompt,
  };
}

export function GuidedCreateFlow({ hasLowCredits }: { hasLowCredits: boolean }) {
  const [roughPrompt, setRoughPrompt] = useState("");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  const canGenerate = useMemo(() => Boolean(brief?.prompt.trim() && brief?.cta.trim()), [brief]);

  async function upgradePrompt() {
    if (!roughPrompt.trim()) return;
    setResult(null);
    setError(null);
    setBrief(makeBrief(roughPrompt.trim()));
  }

  async function generate(e: FormEvent) {
    e.preventDefault();
    if (!brief || !canGenerate) return;
    setBusy(true);
    setError(null);

    try {
      const conversationRes = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Guided Create" }),
      });
      const conversationJson = await conversationRes.json();
      if (!conversationRes.ok) throw new Error(conversationJson.error ?? "Could not start create session.");

      const content = [
        "Create a premium short-form promo video.",
        `Original prompt: ${brief.prompt}`,
        `Target channel: ${brief.targetChannel}`,
        `Tone/style: ${brief.tone}`,
        `Duration target: ${brief.duration}`,
        `Caption guidance: ${brief.captionHint}`,
        `CTA to use: ${brief.cta}`,
        `Preset: ${brief.stylePreset}`,
      ].join("\n");

      const sendRes = await fetch(`/api/chat/conversations/${conversationJson.conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mode: "generate_video" }),
      });
      const sendJson = await sendRes.json().catch(() => ({}));
      if (!sendRes.ok) {
        throw new Error((sendJson as { error?: string }).error ?? "Generation failed.");
      }

      const threadRes = await fetch(`/api/chat/conversations/${conversationJson.conversation.id}/messages`);
      const threadJson = await threadRes.json();
      const latestResult = [...(threadJson.messages ?? [])].reverse().find((message: any) => message.kind === "result");
      const metadata = (latestResult?.metadataJson ?? {}) as Record<string, unknown>;
      setResult({
        videoUrl: typeof metadata.videoUrl === "string" ? metadata.videoUrl : null,
        downloadUrl: typeof metadata.downloadUrl === "string" ? metadata.downloadUrl : null,
        caption: typeof metadata.caption === "string" ? metadata.caption : "",
        ctaText: typeof metadata.ctaText === "string" ? metadata.ctaText : "",
        targetChannel: typeof metadata.targetChannel === "string" ? metadata.targetChannel : brief.targetChannel,
        creditsConsumed: typeof metadata.creditsConsumed === "number" ? metadata.creditsConsumed : VIDEO_CREDIT_COST,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="cl-card p-5 md:p-6">
        <p className="cl-kicker">Step 1</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Describe the promo concept</h2>
        <textarea
          className="cl-textarea mt-3"
          placeholder="Example: Create a 15s TikTok promo for our new spring skincare bundle for busy professionals."
          value={roughPrompt}
          onChange={(event) => setRoughPrompt(event.target.value)}
        />
        <button onClick={upgradePrompt} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500">
          Build brief
        </button>
      </section>

      {brief ? (
        <form className="cl-card p-5 md:p-6" onSubmit={generate}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="cl-kicker">Step 2</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Refine the brief</h2>
            </div>
            <p className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700">{VIDEO_CREDIT_COST} credits per render</p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Target channel">
              <select className="cl-select" value={brief.targetChannel} onChange={(e) => setBrief({ ...brief, targetChannel: e.target.value as Brief["targetChannel"] })}>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </Field>
            <Field label="Duration">
              <input className="cl-input" value={brief.duration} onChange={(e) => setBrief({ ...brief, duration: e.target.value })} />
            </Field>
            <Field label="Tone / style">
              <input className="cl-input" value={brief.tone} onChange={(e) => setBrief({ ...brief, tone: e.target.value })} />
            </Field>
            <Field label="Style preset">
              <input className="cl-input" value={brief.stylePreset} onChange={(e) => setBrief({ ...brief, stylePreset: e.target.value })} />
            </Field>
            <Field label="CTA">
              <input className="cl-input" value={brief.cta} onChange={(e) => setBrief({ ...brief, cta: e.target.value })} />
            </Field>
            <Field label="Caption hint">
              <input className="cl-input" value={brief.captionHint} onChange={(e) => setBrief({ ...brief, captionHint: e.target.value })} />
            </Field>
          </div>

          <Field label="Prompt context" className="mt-3">
            <textarea className="cl-textarea" value={brief.prompt} onChange={(e) => setBrief({ ...brief, prompt: e.target.value })} />
          </Field>

          {hasLowCredits ? (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              Credit balance is low. If generation fails, open <Link href="/pricing" className="underline">pricing</Link> to upgrade.
            </div>
          ) : null}
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

          <button disabled={busy || !canGenerate} className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Generating..." : "Generate video"}
          </button>
        </form>
      ) : null}

      {result ? (
        <section className="cl-card p-5 md:p-6">
          <p className="cl-kicker">Step 3</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Output</h2>
          <div className="mt-3 space-y-3">
            {result.videoUrl ? <video src={result.videoUrl} controls className="w-full rounded-lg border border-slate-300 bg-black" /> : <p className="text-sm text-slate-600">No preview returned.</p>}
            <div className="grid gap-2 text-sm text-slate-700">
              <p><strong className="text-slate-900">Channel:</strong> {result.targetChannel}</p>
              <p><strong className="text-slate-900">Caption:</strong> {result.caption || "n/a"}</p>
              <p><strong className="text-slate-900">CTA:</strong> {result.ctaText || "n/a"}</p>
              <p><strong className="text-slate-900">Credits used:</strong> {result.creditsConsumed ?? VIDEO_CREDIT_COST}</p>
            </div>
            {result.downloadUrl ? <a href={result.downloadUrl} className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-slate-400">Download video</a> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, className, children }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
