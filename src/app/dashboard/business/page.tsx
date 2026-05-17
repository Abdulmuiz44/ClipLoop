"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PromoPackDisplay } from "@/components/business/promo-pack-display";
import type { BusinessProfile, PromoPack } from "@/lib/business/schemas";

type SavedProfile = {
  id: string;
  businessName: string | null;
  websiteUrl: string;
  industry: string | null;
  createdAt: string;
};

const EMPTY_PROFILE: BusinessProfile = {
  websiteUrl: "",
  businessName: "",
  industry: "",
  targetAudience: "",
  mainOffer: "",
  productsOrServices: [],
  keyBenefits: [],
  painPointsSolved: [],
  brandTone: "",
  contentAngles: [],
  ctaIdeas: [],
  oneLineSummary: "",
  longSummary: "",
};

export default function BusinessPage() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [promoPack, setPromoPack] = useState<PromoPack | null>(null);
  const [savedProfileId, setSavedProfileId] = useState<string | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const viewProfile = profile ?? EMPTY_PROFILE;
  const step = useMemo(() => (!profile ? 1 : !promoPack ? 2 : 3), [profile, promoPack]);

  useEffect(() => {
    fetch("/api/business/profiles")
      .then((response) => response.json())
      .then((json) => setSavedProfiles((json.profiles ?? []).slice(0, 4)))
      .catch(() => {});
  }, []);

  function updateProfile<K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) {
    setProfile((prev) => ({ ...(prev ?? EMPTY_PROFILE), [key]: value }));
  }

  async function analyzeWebsite() {
    if (!websiteUrl.trim()) return;
    setIsAnalyzing(true);
    setError("");
    setSuccess("");
    setPromoPack(null);
    try {
      const response = await fetch("/api/business/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Analyze failed");
      setProfile(json.profile);
      setSuccess("Business context extracted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyze failed");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function saveProfile() {
    if (!profile) return;
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/business/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Save failed");
      setSavedProfileId(json.profile.id);
      setSuccess("Business profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function generatePromoPack() {
    if (!profile) return;
    setIsGenerating(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/business/generate-promo-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, businessProfileId: savedProfileId ?? undefined }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Generation failed");
      setPromoPack(json.promoPack);
      setSuccess("Promo pack generated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="cl-card p-6">
        <p className="cl-kicker">Business Context Engine</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">Turn your website into a promo content engine.</h1>
        <p className="mt-2 text-sm text-slate-400">Paste your website and ClipLoop extracts your offer, audience, and positioning into reusable content context.</p>
      </section>

      <section className="cl-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">Saved businesses</h2>
          <Link href="/dashboard/business/profiles" className="text-xs text-blue-400 hover:text-blue-300">
            View all
          </Link>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {savedProfiles.length === 0 ? <p className="text-sm text-slate-400">No saved profiles yet.</p> : null}
          {savedProfiles.map((saved) => (
            <Link key={saved.id} href={`/dashboard/business/${saved.id}`} className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm transition hover:border-slate-600">
              <p className="font-medium text-slate-100">{saved.businessName || "Untitled business"}</p>
              <p className="mt-1 text-xs text-slate-400">{saved.websiteUrl}</p>
              <p className="mt-1 text-xs text-slate-500">{saved.industry || "-"}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <StepBadge title="Analyze website" step={1} active={step >= 1} />
        <StepBadge title="Review profile" step={2} active={step >= 2} />
        <StepBadge title="Generate pack" step={3} active={step >= 3} />
      </section>

      <section className="cl-card p-5">
        <label className="text-sm font-medium text-slate-300">Website URL</label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://yourbusiness.com" className="cl-input" />
          <Button onClick={analyzeWebsite} disabled={isAnalyzing || !websiteUrl.trim()}>
            {isAnalyzing ? "Analyzing..." : "Analyze Website"}
          </Button>
        </div>
      </section>

      {profile ? (
        <section className="cl-card p-5">
          <h2 className="text-base font-semibold text-slate-100">Business profile</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Business name" value={viewProfile.businessName} onChange={(value) => updateProfile("businessName", value)} />
            <Field label="Industry" value={viewProfile.industry} onChange={(value) => updateProfile("industry", value)} />
            <Field label="Target audience" value={viewProfile.targetAudience} onChange={(value) => updateProfile("targetAudience", value)} />
            <Field label="Main offer" value={viewProfile.mainOffer} onChange={(value) => updateProfile("mainOffer", value)} />
            <Field label="Brand tone" value={viewProfile.brandTone} onChange={(value) => updateProfile("brandTone", value)} />
            <Field label="One-line summary" value={viewProfile.oneLineSummary} onChange={(value) => updateProfile("oneLineSummary", value)} />
            <ArrayField label="Products / services" value={viewProfile.productsOrServices} onChange={(value) => updateProfile("productsOrServices", value)} />
            <ArrayField label="Key benefits" value={viewProfile.keyBenefits} onChange={(value) => updateProfile("keyBenefits", value)} />
            <ArrayField label="Pain points solved" value={viewProfile.painPointsSolved} onChange={(value) => updateProfile("painPointsSolved", value)} />
            <ArrayField label="Content angles" value={viewProfile.contentAngles} onChange={(value) => updateProfile("contentAngles", value)} />
            <ArrayField label="CTA ideas" value={viewProfile.ctaIdeas} onChange={(value) => updateProfile("ctaIdeas", value)} className="md:col-span-2" />
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-300">Long summary</span>
              <textarea className="cl-textarea" value={viewProfile.longSummary} onChange={(event) => updateProfile("longSummary", event.target.value)} />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={saveProfile} disabled={isSaving}>{isSaving ? "Saving..." : "Save Profile"}</Button>
            <Button onClick={generatePromoPack} disabled={isGenerating} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
              {isGenerating ? "Generating..." : "Generate Promo Pack"}
            </Button>
          </div>
        </section>
      ) : null}

      {error ? <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
      {success ? <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{success}</p> : null}

      {promoPack ? <PromoPackDisplay pack={promoPack} /> : null}
    </div>
  );
}

function StepBadge({ title, step, active }: { title: string; step: number; active: boolean }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${active ? "border-blue-500/40 bg-blue-500/10" : "border-slate-800 bg-slate-900"}`}>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Step {step}</p>
      <p className="mt-1 text-sm font-medium text-slate-100">{title}</p>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-1 block text-sm font-medium text-slate-300">{label}</span>
      <input className="cl-input" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ArrayField({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-sm font-medium text-slate-300">{label}</span>
      <textarea
        className="cl-textarea min-h-24"
        value={value.join("\n")}
        onChange={(event) => onChange(event.target.value.split("\n").map((line) => line.trim()).filter(Boolean))}
      />
      <span className="mt-1 block text-xs text-slate-500">One item per line.</span>
    </label>
  );
}
