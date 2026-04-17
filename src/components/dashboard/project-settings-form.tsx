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
    preferredChannels: string | null;
    languageStyle: "english" | "pidgin" | "mixed" | null;
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
        preferredChannels: String(formData.get("preferredChannels") ?? "") || null,
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
    <form action={onSubmit} className="space-y-3 rounded border bg-white p-4">
      <div>
        <h3 className="font-semibold">Project settings</h3>
        <p className="mt-1 text-sm text-slate-600">Update this profile anytime. Generation uses these fields directly.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input className="w-full rounded border p-2" name="name" defaultValue={project.name} placeholder="Workspace name" />
        <input className="w-full rounded border p-2" name="productName" defaultValue={project.productName} placeholder="Product name" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <select className="w-full rounded border p-2" name="projectType" defaultValue={project.projectType ?? ""}>
          <option value="">Project type</option>
          <option value="business">Business</option>
          <option value="creator">Creator</option>
          <option value="app">App</option>
        </select>
        <select className="w-full rounded border p-2" name="languageStyle" defaultValue={project.languageStyle ?? ""}>
          <option value="">Language style</option>
          <option value="english">English</option>
          <option value="pidgin">Pidgin</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input className="w-full rounded border p-2" name="businessName" defaultValue={project.businessName ?? ""} placeholder="Business name" />
        <input className="w-full rounded border p-2" name="businessCategory" defaultValue={project.businessCategory ?? ""} placeholder="Business category" />
      </div>
      <textarea
        className="min-h-24 w-full rounded border p-2"
        name="businessDescription"
        defaultValue={project.businessDescription ?? ""}
        placeholder="Business description"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <input className="w-full rounded border p-2" name="city" defaultValue={project.city ?? ""} placeholder="City" />
        <input className="w-full rounded border p-2" name="state" defaultValue={project.state ?? ""} placeholder="State" />
      </div>

      <input className="w-full rounded border p-2" name="targetAudience" defaultValue={project.targetAudience ?? ""} placeholder="Target audience" />
      <div className="grid gap-3 md:grid-cols-2">
        <input className="w-full rounded border p-2" name="primaryOffer" defaultValue={project.primaryOffer ?? ""} placeholder="Primary offer" />
        <input className="w-full rounded border p-2" name="priceRange" defaultValue={project.priceRange ?? ""} placeholder="Price range" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="w-full rounded border p-2" name="tone" defaultValue={project.tone ?? ""} placeholder="Tone" />
        <input className="w-full rounded border p-2" name="callToAction" defaultValue={project.callToAction ?? ""} placeholder="Call to action" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="w-full rounded border p-2" name="instagramHandle" defaultValue={project.instagramHandle ?? ""} placeholder="Instagram handle" />
        <input className="w-full rounded border p-2" name="whatsappNumber" defaultValue={project.whatsappNumber ?? ""} placeholder="WhatsApp number" />
      </div>
      <input className="w-full rounded border p-2" name="preferredChannels" defaultValue={project.preferredChannels ?? ""} placeholder="Preferred channels" />

      <div className="grid gap-3 md:grid-cols-2">
        <input className="w-full rounded border p-2" name="websiteUrl" defaultValue={project.websiteUrl ?? ""} placeholder="Website URL" />
        <input className="w-full rounded border p-2" name="ctaUrl" defaultValue={project.ctaUrl} placeholder="CTA URL" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input className="w-full rounded border p-2" name="oneLiner" defaultValue={project.oneLiner ?? ""} placeholder="One-liner" />
        <input className="w-full rounded border p-2" name="audience" defaultValue={project.audience} placeholder="Audience (legacy)" />
        <input className="w-full rounded border p-2" name="niche" defaultValue={project.niche} placeholder="Niche (legacy)" />
      </div>
      <input className="w-full rounded border p-2" name="offer" defaultValue={project.offer} placeholder="Offer (legacy)" />
      <textarea className="min-h-20 w-full rounded border p-2" name="description" defaultValue={project.description} placeholder="Description (legacy)" />

      <select className="w-full rounded border p-2" name="goalType" defaultValue={project.goalType}>
        <option value="clicks">Drive clicks</option>
        <option value="signups">Drive signups</option>
        <option value="revenue">Drive revenue</option>
      </select>
      <textarea
        className="min-h-20 w-full rounded border p-2"
        name="voiceStyleNotes"
        defaultValue={((project.voicePrefsJson as { style_notes?: string } | null)?.style_notes ?? "") as string}
        placeholder="Voice notes"
      />
      <textarea
        className="min-h-20 w-full rounded border p-2"
        name="examplePosts"
        defaultValue={((project.examplePostsJson as string[] | null) ?? []).join("\n")}
        placeholder="Example posts, one per line"
      />

      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
      <Button disabled={loading}>{loading ? "Saving..." : "Save settings"}</Button>
    </form>
  );
}
