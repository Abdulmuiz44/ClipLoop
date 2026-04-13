"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ProjectSettingsForm({
  project,
}: {
  project: {
    id: string;
    name: string;
    productName: string;
    oneLiner: string | null;
    description: string;
    audience: string;
    niche: string;
    offer: string;
    websiteUrl: string | null;
    ctaUrl: string;
    goalType: "clicks" | "signups" | "revenue";
    examplePostsJson: unknown;
    voicePrefsJson: unknown;
  };
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const examplePostsRaw = String(formData.get("examplePosts") ?? "");
    const res = await fetch(`/api/projects/${project.id}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        productName: String(formData.get("productName") ?? ""),
        oneLiner: String(formData.get("oneLiner") ?? "") || null,
        description: String(formData.get("description") ?? ""),
        audience: String(formData.get("audience") ?? ""),
        niche: String(formData.get("niche") ?? ""),
        offer: String(formData.get("offer") ?? ""),
        websiteUrl: String(formData.get("websiteUrl") ?? "") || null,
        ctaUrl: String(formData.get("ctaUrl") ?? ""),
        goalType: String(formData.get("goalType") ?? project.goalType),
        voiceStyleNotes: String(formData.get("voiceStyleNotes") ?? "") || null,
        examplePosts: examplePostsRaw
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      }),
    });

    const json = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Settings saved." : json.error ?? "Failed to save settings");
    setLoading(false);
  }

  return (
    <form action={onSubmit} className="space-y-3 rounded border bg-white p-4">
      <div>
        <h3 className="font-semibold">Project settings</h3>
        <p className="mt-1 text-sm text-slate-600">Tighten the positioning and CTA here without recreating the project.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="w-full rounded border p-2" name="name" defaultValue={project.name} placeholder="Workspace name" />
        <input className="w-full rounded border p-2" name="productName" defaultValue={project.productName} placeholder="Product name" />
      </div>
      <input className="w-full rounded border p-2" name="oneLiner" defaultValue={project.oneLiner ?? ""} placeholder="One-liner" />
      <textarea className="min-h-24 w-full rounded border p-2" name="description" defaultValue={project.description} placeholder="Description" />
      <div className="grid gap-3 md:grid-cols-2">
        <input className="w-full rounded border p-2" name="audience" defaultValue={project.audience} placeholder="Audience" />
        <input className="w-full rounded border p-2" name="niche" defaultValue={project.niche} placeholder="Niche" />
      </div>
      <input className="w-full rounded border p-2" name="offer" defaultValue={project.offer} placeholder="Offer" />
      <div className="grid gap-3 md:grid-cols-2">
        <input className="w-full rounded border p-2" name="websiteUrl" defaultValue={project.websiteUrl ?? ""} placeholder="Website URL" />
        <input className="w-full rounded border p-2" name="ctaUrl" defaultValue={project.ctaUrl} placeholder="CTA URL" />
      </div>
      <select className="w-full rounded border p-2" name="goalType" defaultValue={project.goalType}>
        <option value="clicks">Drive clicks</option>
        <option value="signups">Drive signups</option>
        <option value="revenue">Drive revenue</option>
      </select>
      <textarea
        className="min-h-24 w-full rounded border p-2"
        name="voiceStyleNotes"
        defaultValue={((project.voicePrefsJson as { style_notes?: string } | null)?.style_notes ?? "") as string}
        placeholder="Voice notes"
      />
      <textarea
        className="min-h-24 w-full rounded border p-2"
        name="examplePosts"
        defaultValue={((project.examplePostsJson as string[] | null) ?? []).join("\n")}
        placeholder="Example posts, one per line"
      />
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
      <Button disabled={loading}>{loading ? "Saving..." : "Save settings"}</Button>
    </form>
  );
}
