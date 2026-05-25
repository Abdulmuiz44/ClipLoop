"use client";

import { FormEvent, type ReactNode, useRef, useState } from "react";

type Channel = "instagram" | "tiktok" | "whatsapp" | "x";

type ReusableInputSnapshot = {
  appName?: string;
  appWebsiteUrl?: string;
  weeklyUpdate?: string;
  targetAudience?: string;
  callToAction?: string;
  channel?: Channel;
  tone?: string;
};

type RecentWeeklyPromo = {
  id: string;
  createdAt: string;
  appName: string;
  channel: string;
  videoUrl: string;
  artifactUrl: string;
  inputSnapshot?: ReusableInputSnapshot | null;
};

type WeeklyPromoResult = {
  websiteContextUsed: boolean;
  scrapeError: string | null;
  script: {
    hook: string;
    caption: string;
    cta: string;
  };
  preview: {
    videoUrl: string;
    thumbnailUrl: string;
    downloadUrl: string;
  };
  artifact: {
    artifactUrl: string;
  };
};

export function WeeklyPromoFlow({ recentPromos = [] }: { recentPromos?: RecentWeeklyPromo[] }) {
  const [appName, setAppName] = useState("");
  const [appWebsiteUrl, setAppWebsiteUrl] = useState("");
  const [weeklyUpdate, setWeeklyUpdate] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [channel, setChannel] = useState<Channel>("instagram");
  const [tone, setTone] = useState("confident and practical");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WeeklyPromoResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);
  const weeklyUpdateRef = useRef<HTMLTextAreaElement | null>(null);
  const outputRef = useRef<HTMLElement | null>(null);

  const canSubmit = appName.trim().length > 0 && weeklyUpdate.trim().length > 0 && !busy;

  function reuseInputs(promo: RecentWeeklyPromo) {
    const snapshot = promo.inputSnapshot;

    if (snapshot) {
      setAppName(snapshot.appName ?? "");
      setAppWebsiteUrl(snapshot.appWebsiteUrl ?? "");
      setWeeklyUpdate(snapshot.weeklyUpdate ?? "");
      setTargetAudience(snapshot.targetAudience ?? "");
      setCallToAction(snapshot.callToAction ?? "");
      if (snapshot.channel) setChannel(snapshot.channel);
      if (snapshot.tone) setTone(snapshot.tone);
    } else {
      setAppName(promo.appName || "");
      if (promo.channel === "instagram" || promo.channel === "tiktok" || promo.channel === "whatsapp" || promo.channel === "x") {
        setChannel(promo.channel);
      }
      setWeeklyUpdate("");
    }

    setError(null);
    setSuccessMessage(null);
    requestAnimationFrame(() => {
      weeklyUpdateRef.current?.focus();
      weeklyUpdateRef.current?.select();
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);
    setSuccessMessage(null);
    setResult(null);

    try {
      const response = await fetch("/api/weekly-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName,
          appWebsiteUrl,
          weeklyUpdate,
          targetAudience,
          callToAction,
          channel,
          tone,
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((json as { error?: string }).error || "Failed to generate weekly promo");
      }

      const nextResult = (json as { result: WeeklyPromoResult }).result;
      setResult(nextResult);
      const generatedAt = new Date().toISOString();
      setLastGeneratedAt(generatedAt);
      setSuccessMessage("Weekly promo generated successfully.");
      requestAnimationFrame(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      setSuccessMessage(null);
      setError(err instanceof Error ? err.message : "Failed to generate weekly promo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="cl-card p-5 md:p-6 space-y-4">
        <div>
          <p className="cl-kicker">Weekly Promo MVP</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Product context + weekly update → promo video</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="App name">
            <input className="cl-input" value={appName} onChange={(e) => setAppName(e.target.value)} required />
          </Field>
          <Field label="Website URL (optional but recommended)">
            <input className="cl-input" value={appWebsiteUrl} onChange={(e) => setAppWebsiteUrl(e.target.value)} placeholder="https://..." />
            <p className="mt-1 text-xs text-slate-500">Used as supporting context only. Your weekly update stays the main video topic.</p>
          </Field>
          <Field label="Channel">
            <select className="cl-select" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
              <option value="instagram">Instagram</option>
              <option value="x">X</option>
              <option value="tiktok">TikTok</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </Field>
          <Field label="Tone">
            <input className="cl-input" value={tone} onChange={(e) => setTone(e.target.value)} required />
          </Field>
          <Field label="Target audience (optional)">
            <input className="cl-input" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
          </Field>
          <Field label="Call to action (optional)">
            <input className="cl-input" value={callToAction} onChange={(e) => setCallToAction(e.target.value)} />
          </Field>
        </div>

        <Field label="Weekly update">
          <textarea ref={weeklyUpdateRef} className="cl-textarea" value={weeklyUpdate} onChange={(e) => setWeeklyUpdate(e.target.value)} required />
        </Field>

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        {successMessage ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <p>{successMessage}</p>
            {lastGeneratedAt ? <p className="mt-0.5 text-xs text-emerald-700">Last generated: {new Date(lastGeneratedAt).toLocaleString()}</p> : null}
          </div>
        ) : null}

        <button disabled={!canSubmit} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Generating..." : "Generate weekly promo"}
        </button>
      </form>

      {result ? (
        <section ref={outputRef} className="cl-card p-5 md:p-6 space-y-3">
          <h3 className="text-base font-semibold text-slate-900">Output</h3>
          {result.preview.videoUrl ? (
            <video src={result.preview.videoUrl} controls className="w-full rounded-lg border border-slate-300 bg-black" />
          ) : result.preview.thumbnailUrl ? (
            <a href={result.preview.thumbnailUrl} target="_blank" rel="noreferrer" className="block w-full rounded-lg border border-slate-300 bg-slate-100 p-5 text-sm text-slate-700">
              Thumbnail preview available. Open image
            </a>
          ) : null}
          <div className="grid gap-1 text-sm text-slate-700">
            <p><strong className="text-slate-900">Hook:</strong> {result.script.hook}</p>
            <p><strong className="text-slate-900">Caption:</strong> {result.script.caption}</p>
            <p><strong className="text-slate-900">CTA:</strong> {result.script.cta}</p>
            <p><strong className="text-slate-900">Website context used:</strong> {result.websiteContextUsed ? "Yes" : "No"}</p>
            {result.scrapeError ? <p><strong className="text-slate-900">Scrape fallback:</strong> {result.scrapeError}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={result.preview.videoUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-slate-400">Open preview</a>
            <a href={result.preview.downloadUrl} className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-slate-400">Download video</a>
            <a href={result.artifact.artifactUrl} className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-slate-400">Download artifact JSON</a>
          </div>
        </section>
      ) : null}

      <section className="cl-card p-5 md:p-6">
        <h3 className="text-base font-semibold text-slate-900">Recent weekly promos</h3>
        {recentPromos.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No saved promos yet. Generate your first one above.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {recentPromos.map((promo) => (
              <div key={promo.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm font-medium text-slate-900">{promo.appName}</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {promo.channel} • {new Date(promo.createdAt).toLocaleString()}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href={promo.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 hover:border-slate-400"
                  >
                    Open video
                  </a>
                  <a
                    href={promo.artifactUrl}
                    className="inline-flex rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 hover:border-slate-400"
                  >
                    Artifact JSON
                  </a>
                  <button
                    type="button"
                    onClick={() => reuseInputs(promo)}
                    className="inline-flex rounded-md border border-emerald-300 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:border-emerald-400"
                  >
                    Reuse inputs
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
