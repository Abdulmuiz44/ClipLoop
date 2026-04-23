"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { normalizeProjectChannels } from "@/lib/utils/channels";

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
    projectType: "business" | "creator" | "app" | null;
    businessName: string | null;
    businessCategory: string | null;
    businessDescription: string | null;
    city: string | null;
    state: string | null;
    targetAudience: string | null;
    primaryOffer: string | null;
    priceRange: string | null;
    tone: string | null;
    callToAction: string | null;
    instagramHandle: string | null;
    whatsappNumber: string | null;
    websiteUrl: string | null;
    ctaUrl: string;
    preferredChannelsJson: unknown;
    preferredChannels: string | null;
    languageStyle: "english" | "pidgin" | "mixed" | null;
    goalType: "clicks" | "signups" | "revenue";
    examplePostsJson: unknown;
    voicePrefsJson: unknown;
  };
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const selectedChannels = normalizeProjectChannels(project.preferredChannelsJson, project.preferredChannels);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const examplePostsRaw = String(formData.get("examplePosts") ?? "");
    const preferredChannels = formData
      .getAll("preferredChannels")
      .map((value) => String(value).toLowerCase().trim())
      .filter((value): value is "instagram" | "tiktok" | "whatsapp" =>
        ["instagram", "tiktok", "whatsapp"].includes(value),
      );
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
        projectType: String(formData.get("projectType") ?? "") || null,
        businessName: String(formData.get("businessName") ?? "") || null,
        businessCategory: String(formData.get("businessCategory") ?? "") || null,
        businessDescription: String(formData.get("businessDescription") ?? "") || null,
        city: String(formData.get("city") ?? "") || null,
        state: String(formData.get("state") ?? "") || null,
        targetAudience: String(formData.get("targetAudience") ?? "") || null,
        primaryOffer: String(formData.get("primaryOffer") ?? "") || null,
        priceRange: String(formData.get("priceRange") ?? "") || null,
        tone: String(formData.get("tone") ?? "") || null,
        callToAction: String(formData.get("callToAction") ?? "") || null,
        instagramHandle: String(formData.get("instagramHandle") ?? "") || null,
        whatsappNumber: String(formData.get("whatsappNumber") ?? "") || null,
        websiteUrl: String(formData.get("websiteUrl") ?? "") || null,
        ctaUrl: String(formData.get("ctaUrl") ?? ""),
        preferredChannels: preferredChannels.length > 0 ? preferredChannels : ["instagram"],
        languageStyle: String(formData.get("languageStyle") ?? "") || null,
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
    <form action={onSubmit} className="cl-card p-6 space-y-6">
      <div className="border-b pb-4 cl-divider">
        <h3 className="text-lg font-semibold text-slate-950">Workspace Settings</h3>
        <p className="mt-1 text-sm text-slate-600">Update your brand profile. Changes reflect in future generations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Workspace name</span>
          <input className="cl-input" name="name" defaultValue={project.name} placeholder="Main profile" />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Brand/Product name</span>
          <input className="cl-input" name="productName" defaultValue={project.productName} placeholder="Acme Analytics" />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Project type</span>
          <select className="cl-select" name="projectType" defaultValue={project.projectType ?? ""}>
            <option value="">Select type</option>
            <option value="business">Business</option>
            <option value="creator">Creator</option>
            <option value="app">App</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Language style</span>
          <select className="cl-select" name="languageStyle" defaultValue={project.languageStyle ?? ""}>
            <option value="">Select style</option>
            <option value="english">English</option>
            <option value="pidgin">Pidgin</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Category</span>
          <input className="cl-input" name="businessCategory" defaultValue={project.businessCategory ?? ""} placeholder="SaaS for marketers" />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">One-liner</span>
          <input className="cl-input" name="oneLiner" defaultValue={project.oneLiner ?? ""} placeholder="Growth automation for indie teams" />
        </label>
      </div>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Description</span>
        <textarea
          className="cl-textarea min-h-24"
          name="businessDescription"
          defaultValue={project.businessDescription ?? ""}
          placeholder="What you sell and why it matters."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">City</span>
          <input className="cl-input" name="city" defaultValue={project.city ?? ""} placeholder="San Francisco" />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">State / Region</span>
          <input className="cl-input" name="state" defaultValue={project.state ?? ""} placeholder="CA" />
        </label>
      </div>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Target audience</span>
        <input className="cl-input" name="targetAudience" defaultValue={project.targetAudience ?? ""} placeholder="Founders and marketers" />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Primary offer</span>
          <input className="cl-input" name="primaryOffer" defaultValue={project.primaryOffer ?? ""} placeholder="Starter pack: $19/mo" />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Price range</span>
          <input className="cl-input" name="priceRange" defaultValue={project.priceRange ?? ""} placeholder="$19 - $99" />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Voice Tone</span>
          <input className="cl-input" name="tone" defaultValue={project.tone ?? ""} placeholder="Calm and premium" />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Call to action</span>
          <input className="cl-input" name="callToAction" defaultValue={project.callToAction ?? ""} placeholder="Get started now" />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Instagram Handle</span>
          <input className="cl-input" name="instagramHandle" defaultValue={project.instagramHandle ?? ""} placeholder="@brand" />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">WhatsApp Number</span>
          <input className="cl-input" name="whatsappNumber" defaultValue={project.whatsappNumber ?? ""} placeholder="+1..." />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Preferred channels</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-xl border p-3 cl-divider bg-white">
            <input type="checkbox" name="preferredChannels" value="instagram" defaultChecked={selectedChannels.includes("instagram")} />
            <span className="text-sm font-medium">Instagram</span>
          </label>
          <label className="flex items-center gap-2 rounded-xl border p-3 cl-divider bg-white">
            <input type="checkbox" name="preferredChannels" value="tiktok" defaultChecked={selectedChannels.includes("tiktok")} />
            <span className="text-sm font-medium">TikTok</span>
          </label>
          <label className="flex items-center gap-2 rounded-xl border p-3 cl-divider bg-white">
            <input type="checkbox" name="preferredChannels" value="whatsapp" defaultChecked={selectedChannels.includes("whatsapp")} />
            <span className="text-sm font-medium">WhatsApp</span>
          </label>
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Website URL</span>
          <input className="cl-input" name="websiteUrl" defaultValue={project.websiteUrl ?? ""} placeholder="https://..." />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Conversion Destination</span>
          <input className="cl-input" name="ctaUrl" defaultValue={project.ctaUrl} placeholder="https://..." />
        </label>
      </div>

      <div className="space-y-4 border-t pt-6 cl-divider">
        <label className="space-y-1 block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Conversion Goal</span>
          <select className="cl-select" name="goalType" defaultValue={project.goalType}>
            <option value="clicks">Drive clicks</option>
            <option value="signups">Drive signups</option>
            <option value="revenue">Drive revenue</option>
          </select>
        </label>
        
        <label className="space-y-1 block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Detailed voice notes</span>
          <textarea
            className="cl-textarea min-h-20"
            name="voiceStyleNotes"
            defaultValue={((project.voicePrefsJson as { style_notes?: string } | null)?.style_notes ?? "") as string}
            placeholder="Additional notes about your brand voice..."
          />
        </label>
        
        <label className="space-y-1 block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Example posts</span>
          <textarea
            className="cl-textarea min-h-24 font-mono text-xs"
            name="examplePosts"
            defaultValue={((project.examplePostsJson as string[] | null) ?? []).join("\n")}
            placeholder="Paste your past successful hooks or posts, one per line..."
          />
        </label>
      </div>

      <div className="pt-4 border-t cl-divider flex items-center justify-between gap-4">
        {message ? <p className="text-sm font-medium text-emerald-600">{message}</p> : <div />}
        <Button className="px-8" disabled={loading}>{loading ? "Saving..." : "Save changes"}</Button>
      </div>
    </form>
  );
}
