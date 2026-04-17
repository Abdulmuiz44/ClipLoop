"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const preferredChannels = formData
      .getAll("preferredChannels")
      .map((v) => String(v))
      .filter((v) => ["instagram", "tiktok", "whatsapp"].includes(v));

    const payload = {
      websiteUrl: String(formData.get("websiteUrl") ?? "") || null,
      businessName: String(formData.get("businessName") ?? ""),
      businessCategory: String(formData.get("businessCategory") ?? ""),
      businessDescription: String(formData.get("businessDescription") ?? ""),
      targetAudience: String(formData.get("targetAudience") ?? ""),
      primaryOffer: String(formData.get("primaryOffer") ?? ""),
      tone: String(formData.get("tone") ?? "") || null,
      preferredChannels: preferredChannels.length > 0 ? preferredChannels : ["instagram"],
      instagramHandle: String(formData.get("instagramHandle") ?? "") || null,
      whatsappNumber: String(formData.get("whatsappNumber") ?? "") || null,
      callToAction: String(formData.get("callToAction") ?? "") || null,
      projectType: String(formData.get("projectType") ?? "business"),
      languageStyle: String(formData.get("languageStyle") ?? "english"),
      city: String(formData.get("city") ?? "") || null,
      state: String(formData.get("state") ?? "") || null,
    };

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(json.error ?? "Failed to complete onboarding.");
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-2xl border bg-white p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Set up your business context</h1>
        <p className="mt-1 text-sm text-slate-600">This powers chat requests automatically so you can ask for promo videos in natural language.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Website URL</span>
          <input name="websiteUrl" type="url" placeholder="https://yourbusiness.com" className="w-full rounded border p-2" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Business name</span>
          <input name="businessName" required className="w-full rounded border p-2" placeholder="Ada Beauty Hub" />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Business category</span>
          <input name="businessCategory" required className="w-full rounded border p-2" placeholder="Beauty products" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Target audience</span>
          <input name="targetAudience" required className="w-full rounded border p-2" placeholder="Women in Lagos looking for affordable beauty essentials" />
        </label>
      </div>

      <label className="space-y-1 text-sm">
        <span className="font-medium">Business description</span>
        <textarea name="businessDescription" required className="min-h-24 w-full rounded border p-2" placeholder="Describe what you sell and what makes your offer useful." />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Primary offer</span>
          <input name="primaryOffer" required className="w-full rounded border p-2" placeholder="Weekend package: 3 products for ₦15,000" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Tone</span>
          <input name="tone" className="w-full rounded border p-2" placeholder="Warm, direct, and practical" />
        </label>
      </div>

      <fieldset className="space-y-2 text-sm">
        <legend className="font-medium">Preferred channels</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded border p-2">
            <input type="checkbox" name="preferredChannels" value="instagram" defaultChecked />
            Instagram
          </label>
          <label className="flex items-center gap-2 rounded border p-2">
            <input type="checkbox" name="preferredChannels" value="tiktok" />
            TikTok
          </label>
          <label className="flex items-center gap-2 rounded border p-2">
            <input type="checkbox" name="preferredChannels" value="whatsapp" />
            WhatsApp
          </label>
        </div>
      </fieldset>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Instagram handle (optional)</span>
          <input name="instagramHandle" className="w-full rounded border p-2" placeholder="@brand" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">WhatsApp number (optional)</span>
          <input name="whatsappNumber" className="w-full rounded border p-2" placeholder="+2348012345678" />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Project type</span>
          <select name="projectType" className="w-full rounded border p-2" defaultValue="business">
            <option value="business">Business</option>
            <option value="creator">Creator</option>
            <option value="app">App</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Language style</span>
          <select name="languageStyle" className="w-full rounded border p-2" defaultValue="english">
            <option value="english">English</option>
            <option value="pidgin">Pidgin</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Call to action</span>
          <input name="callToAction" className="w-full rounded border p-2" placeholder="Send a DM now" />
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Finish onboarding"}
      </Button>
    </form>
  );
}
