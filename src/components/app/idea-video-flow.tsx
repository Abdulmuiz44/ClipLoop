"use client";

import { FormEvent, startTransition, useState } from "react";

type IdeaVideoResult = {
  plan: {
    title: string;
    hook: string;
    caption: string;
    cta: string;
    scenes: Array<{ purpose: string; onScreenText: string; narration: string; visualPrompt: string; motion: string }>;
  };
  preview: { videoUrl: string; downloadUrl: string };
  artifact: { artifactUrl: string };
};

export function IdeaVideoFlow() {
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("clear and energetic");
  const [durationSec, setDurationSec] = useState("30");
  const [callToAction, setCallToAction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdeaVideoResult | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || idea.trim().length < 12) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/idea-video", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea, audience, tone, durationSec, callToAction }) });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error((json as { error?: string }).error || "Video generation failed");
      startTransition(() => setResult((json as { result: IdeaVideoResult }).result));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Video generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="cl-card space-y-4 p-5 md:p-6">
        <div><p className="cl-kicker">Idea to video</p><h1 className="mt-1 text-xl font-semibold text-slate-950">Build a YouTube Short from one idea</h1><p className="mt-2 text-sm text-slate-600">ClipLoop creates the script, visual prompts, motion instructions, voiceover, and a rendered vertical draft.</p></div>
        <label><span className="cl-label">Video idea</span><textarea className="cl-textarea" value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="Explain the specific problem, lesson, or story this video should cover." required /></label>
        <div className="grid gap-3 md:grid-cols-2">
          <label><span className="cl-label">Audience</span><input className="cl-input" value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="For example: early-stage founders" /></label>
          <label><span className="cl-label">Tone</span><input className="cl-input" value={tone} onChange={(event) => setTone(event.target.value)} required /></label>
          <label><span className="cl-label">Duration</span><select className="cl-select" value={durationSec} onChange={(event) => setDurationSec(event.target.value)}><option value="15">15 seconds</option><option value="30">30 seconds</option><option value="45">45 seconds</option><option value="60">60 seconds</option></select></label>
          <label><span className="cl-label">Call to action</span><input className="cl-input" value={callToAction} onChange={(event) => setCallToAction(event.target.value)} placeholder="Optional" /></label>
        </div>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        <button disabled={busy || idea.trim().length < 12} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Building video..." : "Build video"}</button>
      </form>
      {result ? <section className="cl-card space-y-5 p-5 md:p-6"><div><p className="cl-kicker">Production package</p><h2 className="mt-1 text-xl font-semibold text-slate-950">{result.plan.title}</h2></div><video src={result.preview.videoUrl} controls className="w-full rounded-lg border border-slate-300 bg-black" /><div className="grid gap-3 text-sm text-slate-700"><p><strong className="text-slate-950">Hook:</strong> {result.plan.hook}</p><p><strong className="text-slate-950">Caption:</strong> {result.plan.caption}</p><p><strong className="text-slate-950">CTA:</strong> {result.plan.cta}</p></div><div className="space-y-3">{result.plan.scenes.map((scene, index) => <article key={`${scene.purpose}-${index}`} className="rounded-lg border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Scene {index + 1}: {scene.purpose}</p><p className="mt-2 text-sm font-medium text-slate-950">{scene.onScreenText}</p><p className="mt-2 text-sm text-slate-700"><strong>Voiceover:</strong> {scene.narration}</p><p className="mt-2 text-sm text-slate-700"><strong>Visual prompt:</strong> {scene.visualPrompt}</p><p className="mt-2 text-sm text-slate-700"><strong>Motion:</strong> {scene.motion}</p></article>)}</div><div className="flex flex-wrap gap-2"><a href={result.preview.downloadUrl} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">Download video</a><a href={result.artifact.artifactUrl} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">Download production package</a></div></section> : null}
    </div>
  );
}
