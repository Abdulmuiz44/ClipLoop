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
      preferredChannels: String(formData.get("preferredChannels") ?? "") || null,
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
    <form action={onSubmit} className="space-y-5 rounded border bg-white p-4 md:p-5">
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Basics</h2>
          <p className="text-sm text-slate-600">Create a simple business profile first. Keep this practical.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Workspace name</span>
            <input name="name" placeholder="Main profile" className="w-full rounded border p-2" required />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Project type</span>
            <select name="projectType" className="w-full rounded border p-2" defaultValue="business" required>
              <option value="business">Business</option>
              <option value="creator">Creator</option>
              <option value="app">App</option>
            </select>
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Business/brand name</span>
            <input name="businessName" placeholder="Ada Beauty Hub" className="w-full rounded border p-2" required />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Category</span>
            <input name="businessCategory" placeholder="Beauty products" className="w-full rounded border p-2" required />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">City</span>
            <input name="city" placeholder="Lagos" className="w-full rounded border p-2" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">State</span>
            <input name="state" placeholder="Lagos State" className="w-full rounded border p-2" />
          </label>
        </div>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Business description</span>
          <textarea
            name="businessDescription"
            placeholder="What you sell, who you help, and why customers choose you."
            className="min-h-24 w-full rounded border p-2"
            required
          />
        </label>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold">Audience</h3>
        </div>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Target audience</span>
          <input name="targetAudience" placeholder="Busy women in Lagos who want affordable beauty products" className="w-full rounded border p-2" required />
        </label>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold">Offer</h3>
        </div>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Primary offer</span>
          <input name="primaryOffer" placeholder="Weekend bundle: 3 products for ₦15,000" className="w-full rounded border p-2" required />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Price range</span>
            <input name="priceRange" placeholder="₦5,000 - ₦20,000" className="w-full rounded border p-2" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Call to action</span>
            <input name="callToAction" placeholder="Send us a WhatsApp message now" className="w-full rounded border p-2" />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold">Channels</h3>
        </div>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Preferred channels</span>
          <input name="preferredChannels" placeholder="Instagram, TikTok, WhatsApp Status" className="w-full rounded border p-2" />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Instagram handle</span>
            <input name="instagramHandle" placeholder="@adabeautyhub" className="w-full rounded border p-2" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">WhatsApp number</span>
            <input name="whatsappNumber" placeholder="+2348012345678" className="w-full rounded border p-2" />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Website URL</span>
            <input name="websiteUrl" placeholder="https://yourbusiness.com" className="w-full rounded border p-2" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Primary destination URL</span>
            <input name="ctaUrl" placeholder="https://wa.me/2348012345678" className="w-full rounded border p-2" required />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold">Style</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Tone</span>
            <input name="tone" placeholder="Friendly, confident, and urgent" className="w-full rounded border p-2" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Language style</span>
            <select name="languageStyle" className="w-full rounded border p-2" defaultValue="english">
              <option value="english">English</option>
              <option value="pidgin">Pidgin</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>
        </div>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating project..." : "Create project"}
      </Button>
    </form>
  );
}
