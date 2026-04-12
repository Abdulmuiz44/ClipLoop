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
    offer: string;
    ctaUrl: string;
    voicePrefsJson: unknown;
  };
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const res = await fetch(`/api/projects/${project.id}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        productName: String(formData.get("productName") ?? ""),
        oneLiner: String(formData.get("oneLiner") ?? "") || null,
        offer: String(formData.get("offer") ?? ""),
        ctaUrl: String(formData.get("ctaUrl") ?? ""),
        voiceStyleNotes: String(formData.get("voiceStyleNotes") ?? "") || null,
      }),
    });

    const json = await res.json();
    setMessage(res.ok ? "Saved" : json.error ?? "Failed to save");
    setLoading(false);
  }

  return (
    <form action={onSubmit} className="space-y-2 rounded border bg-white p-4">
      <h3 className="font-semibold">Project settings</h3>
      <input className="w-full rounded border p-2" name="name" defaultValue={project.name} />
      <input className="w-full rounded border p-2" name="productName" defaultValue={project.productName} />
      <input className="w-full rounded border p-2" name="oneLiner" defaultValue={project.oneLiner ?? ""} />
      <input className="w-full rounded border p-2" name="offer" defaultValue={project.offer} />
      <input className="w-full rounded border p-2" name="ctaUrl" defaultValue={project.ctaUrl} />
      <textarea
        className="w-full rounded border p-2"
        name="voiceStyleNotes"
        defaultValue={((project.voicePrefsJson as { style_notes?: string } | null)?.style_notes ?? "") as string}
      />
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
      <Button disabled={loading}>{loading ? "Saving..." : "Save settings"}</Button>
    </form>
  );
}
