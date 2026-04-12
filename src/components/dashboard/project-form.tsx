"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const examplePostsRaw = String(formData.get("examplePosts") ?? "");
    const payload = {
      name: String(formData.get("name") ?? ""),
      productName: String(formData.get("productName") ?? ""),
      oneLiner: String(formData.get("oneLiner") ?? ""),
      description: String(formData.get("description") ?? ""),
      audience: String(formData.get("audience") ?? ""),
      niche: String(formData.get("niche") ?? ""),
      offer: String(formData.get("offer") ?? ""),
      websiteUrl: String(formData.get("websiteUrl") ?? ""),
      ctaUrl: String(formData.get("ctaUrl") ?? ""),
      goalType: String(formData.get("goalType") ?? "clicks"),
      voiceStyleNotes: String(formData.get("voiceStyleNotes") ?? ""),
      examplePosts: examplePostsRaw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!response.ok) {
      setError(json.error ?? "Failed to create project");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/projects/${json.project.id}`);
    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-5 rounded border bg-white p-4">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Project basics</h2>
        <input name="name" placeholder="Workspace name" className="w-full rounded border p-2" required />
        <input name="productName" placeholder="Product name" className="w-full rounded border p-2" required />
        <input name="oneLiner" placeholder="One-liner" className="w-full rounded border p-2" />
        <textarea name="description" placeholder="Description" className="w-full rounded border p-2" required />
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">Audience + positioning</h3>
        <input name="audience" placeholder="Audience" className="w-full rounded border p-2" required />
        <input name="niche" placeholder="Niche" className="w-full rounded border p-2" required />
        <input name="offer" placeholder="Offer" className="w-full rounded border p-2" required />
        <select name="goalType" className="w-full rounded border p-2" defaultValue="clicks">
          <option value="clicks">Clicks</option>
          <option value="signups">Signups</option>
          <option value="revenue">Revenue</option>
        </select>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium">Destination + voice</h3>
        <input name="websiteUrl" placeholder="Website URL" className="w-full rounded border p-2" />
        <input name="ctaUrl" placeholder="CTA URL" className="w-full rounded border p-2" required />
        <textarea
          name="voiceStyleNotes"
          placeholder="Brand voice/style notes"
          className="w-full rounded border p-2"
        />
        <textarea name="examplePosts" placeholder="Example posts (one per line)" className="w-full rounded border p-2" />
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create project"}</Button>
      <p className="text-xs text-slate-500">Next: generate strategy, generate 5 posts, render, approve, and schedule.</p>
    </form>
  );
}
