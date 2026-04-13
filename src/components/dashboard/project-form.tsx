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

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(json.error ?? "Failed to create project");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/projects/${json.project.id}`);
    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-6 rounded border bg-white p-5">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">1. Product context</h2>
          <p className="text-sm text-slate-600">Give ClipLoop enough detail to write believable weekly short-form promos.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Workspace name</span>
            <input name="name" placeholder="ClipLoop HQ" className="w-full rounded border p-2" required />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Product name</span>
            <input name="productName" placeholder="ClipLoop" className="w-full rounded border p-2" required />
          </label>
        </div>
        <label className="space-y-1 text-sm">
          <span className="font-medium">One-liner</span>
          <input name="oneLiner" placeholder="Weekly short-form growth loop for indie apps" className="w-full rounded border p-2" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Description</span>
          <textarea
            name="description"
            placeholder="What the product does, who it helps, and the result users get."
            className="min-h-28 w-full rounded border p-2"
            required
          />
        </label>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="font-semibold">2. Audience and offer</h3>
          <p className="text-sm text-slate-600">This drives angle selection, hooks, and CTA framing.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Audience</span>
            <input name="audience" placeholder="Indie hackers and small SaaS founders" className="w-full rounded border p-2" required />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Niche</span>
            <input name="niche" placeholder="B2B SaaS growth" className="w-full rounded border p-2" required />
          </label>
        </div>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Offer</span>
          <input name="offer" placeholder="$5 starter plan for one project and weekly content automation" className="w-full rounded border p-2" required />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Primary goal</span>
          <select name="goalType" className="w-full rounded border p-2" defaultValue="clicks">
            <option value="clicks">Drive clicks</option>
            <option value="signups">Drive signups</option>
            <option value="revenue">Drive revenue</option>
          </select>
        </label>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="font-semibold">3. Destination and voice</h3>
          <p className="text-sm text-slate-600">ClipLoop will use this when generating captions, slides, and tracked links.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Website URL</span>
            <input name="websiteUrl" placeholder="https://cliploop.app" className="w-full rounded border p-2" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">CTA URL</span>
            <input name="ctaUrl" placeholder="https://cliploop.app/signup" className="w-full rounded border p-2" required />
          </label>
        </div>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Voice notes</span>
          <textarea
            name="voiceStyleNotes"
            placeholder="Direct, punchy, specific. Avoid marketing fluff."
            className="min-h-24 w-full rounded border p-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Example posts</span>
          <textarea
            name="examplePosts"
            placeholder="One example per line. Use real examples or short references."
            className="min-h-28 w-full rounded border p-2"
          />
        </label>
      </section>

      <section className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <p className="font-medium">What happens next</p>
        <p className="mt-1">After project creation, generate this week’s strategy, generate 5 posts, render them, approve the keepers, then schedule and publish.</p>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating project..." : "Create project"}
      </Button>
    </form>
  );
}
