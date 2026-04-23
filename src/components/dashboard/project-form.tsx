"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SUPPORTED_PROJECT_CHANNELS } from "@/lib/utils/channels";

export function ProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const name = String(formData.get("name") ?? "");
    const projectType = String(formData.get("projectType") ?? "business") as "business" | "creator" | "app";
    const businessName = String(formData.get("businessName") ?? "");
    const businessCategory = String(formData.get("businessCategory") ?? "");
    const businessDescription = String(formData.get("businessDescription") ?? "");
    const targetAudience = String(formData.get("targetAudience") ?? "");
    const primaryOffer = String(formData.get("primaryOffer") ?? "");
    const ctaUrl = String(formData.get("ctaUrl") ?? "");
    const tone = String(formData.get("tone") ?? "");
    const languageStyle = String(formData.get("languageStyle") ?? "english") as "english" | "pidgin" | "mixed";
    const preferredChannels = formData
      .getAll("preferredChannels")
      .map((value) => String(value))
      .filter((value): value is "instagram" | "tiktok" | "whatsapp" =>
        SUPPORTED_PROJECT_CHANNELS.includes(value as (typeof SUPPORTED_PROJECT_CHANNELS)[number]),
      );

    const payload = {
      name,
      productName: businessName || name,
      oneLiner: businessCategory ? `${businessCategory} ${projectType}` : `${projectType} profile`,
      description: businessDescription,
      audience: targetAudience,
      niche: businessCategory || projectType,
      offer: primaryOffer,
      websiteUrl: String(formData.get("websiteUrl") ?? "") || null,
      ctaUrl,
      goalType: "clicks" as const,
      voiceStyleNotes: tone || null,
      examplePosts: [] as string[],
      projectType,
      businessName: businessName || null,
      businessCategory: businessCategory || null,
      businessDescription: businessDescription || null,
      city: String(formData.get("city") ?? "") || null,
      state: String(formData.get("state") ?? "") || null,
      targetAudience: targetAudience || null,
      primaryOffer: primaryOffer || null,
      priceRange: String(formData.get("priceRange") ?? "") || null,
      tone: tone || null,
      callToAction: String(formData.get("callToAction") ?? "") || null,
      instagramHandle: String(formData.get("instagramHandle") ?? "") || null,
      whatsappNumber: String(formData.get("whatsappNumber") ?? "") || null,
      preferredChannels: preferredChannels.length > 0 ? preferredChannels : ["instagram"],
      languageStyle,
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
    <form action={onSubmit} className="cl-card space-y-8 p-6 md:p-8">
      <section className="space-y-4">
        <div className="border-b pb-4 cl-divider">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">Brand Profile</h2>
          <p className="text-sm text-slate-600 leading-relaxed">Establish your brand identity. This context is used for every content generation.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Workspace name</span>
            <input name="name" placeholder="Main profile" className="cl-input" required />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Project type</span>
            <select name="projectType" className="cl-select" defaultValue="business" required>
              <option value="business">Business</option>
              <option value="creator">Creator</option>
              <option value="app">App</option>
            </select>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Brand/Product name</span>
            <input name="businessName" placeholder="Acme Analytics" className="cl-input" required />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Category</span>
            <input name="businessCategory" placeholder="SaaS for marketers" className="cl-input" required />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">City</span>
            <input name="city" placeholder="San Francisco" className="cl-input" />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">State / Region</span>
            <input name="state" placeholder="CA" className="cl-input" />
          </label>
        </div>
        <label className="space-y-1 block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Business description</span>
          <textarea
            name="businessDescription"
            placeholder="Describe what you sell, who you help, and why your offer is unique."
            className="cl-textarea min-h-24"
            required
          />
        </label>
      </section>

      <section className="space-y-4">
        <div className="border-b pb-4 cl-divider">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">Target Audience</h3>
          <p className="text-sm text-slate-600 leading-relaxed">Define who you are reaching to improve hook relevance.</p>
        </div>
        <label className="space-y-1 block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Primary audience</span>
          <input name="targetAudience" placeholder="Founders and marketers looking for distribution" className="cl-input" required />
        </label>
      </section>

      <section className="space-y-4">
        <div className="border-b pb-4 cl-divider">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">Core Offer</h3>
          <p className="text-sm text-slate-600 leading-relaxed">What should the promos push? Specific offers convert better than broad brand awareness.</p>
        </div>
        <label className="space-y-1 block">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Primary offer</span>
          <input name="primaryOffer" placeholder="Starter package: 5 projects for $19/month" className="cl-input" required />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Price range</span>
            <input name="priceRange" placeholder="$19 - $99" className="cl-input" />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Preferred CTA</span>
            <input name="callToAction" placeholder="Get started now" className="cl-input" />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="border-b pb-4 cl-divider">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">Channels & Destinations</h3>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Preferred channels</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="flex items-center gap-2 rounded-xl border bg-white p-3 cl-divider transition hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" name="preferredChannels" value="instagram" defaultChecked />
              <span className="text-sm font-medium">Instagram</span>
            </label>
            <label className="flex items-center gap-2 rounded-xl border bg-white p-3 cl-divider transition hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" name="preferredChannels" value="tiktok" />
              <span className="text-sm font-medium">TikTok</span>
            </label>
            <label className="flex items-center gap-2 rounded-xl border bg-white p-3 cl-divider transition hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" name="preferredChannels" value="whatsapp" />
              <span className="text-sm font-medium">WhatsApp</span>
            </label>
          </div>
        </fieldset>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Instagram handle</span>
            <input name="instagramHandle" placeholder="@brand" className="cl-input" />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">WhatsApp number</span>
            <input name="whatsappNumber" placeholder="+1..." className="cl-input" />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Website URL</span>
            <input name="websiteUrl" placeholder="https://..." className="cl-input" />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Conversion destination URL</span>
            <input name="ctaUrl" placeholder="https://..." className="cl-input" required />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="border-b pb-4 cl-divider">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">Voice & Style</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Brand tone</span>
            <input name="tone" placeholder="Calm, premium, and direct" className="cl-input" />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Language style</span>
            <select name="languageStyle" className="cl-select" defaultValue="english">
              <option value="english">English</option>
              <option value="pidgin">Pidgin</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>
        </div>
      </section>

      <div className="pt-6 border-t cl-divider">
        {error ? <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}
        <Button type="submit" className="w-full md:w-auto md:px-12" disabled={loading}>
          {loading ? "Creating workspace..." : "Create project workspace"}
        </Button>
      </div>
    </form>
  );
}
