"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BusinessProfile, PromoPack } from "@/lib/business/schemas";

type CopyKey = string;

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

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [analyzeSuccess, setAnalyzeSuccess] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<CopyKey | null>(null);

  const canEditProfile = Boolean(profile);
  const viewProfile = profile ?? EMPTY_PROFILE;

  function updateProfile<K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) {
    setProfile((prev) => ({ ...(prev ?? EMPTY_PROFILE), [key]: value }));
  }

  async function analyzeWebsite() {
    setError(null);
    setAnalyzeSuccess(null);
    setSaveSuccess(null);
    setGenerateSuccess(null);
    setPromoPack(null);
    setSavedProfileId(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/business/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl }),
      });
      const json = (await response.json()) as { profile?: BusinessProfile; error?: string };
      if (!response.ok || !json.profile) {
        throw new Error(json.error ?? "Could not analyze this website. Please try another URL.");
      }
      setProfile(json.profile);
      setWebsiteUrl(json.profile.websiteUrl);
      setAnalyzeSuccess("Business context extracted. Review and refine your profile below.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error while analyzing website.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function saveProfile() {
    if (!profile) return;
    setError(null);
    setSaveSuccess(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/business/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const json = (await response.json()) as { profile?: { id?: string }; error?: string };
      if (!response.ok || !json.profile?.id) {
        throw new Error(json.error ?? "We could not save this business profile right now.");
      }
      setSavedProfileId(json.profile.id);
      setSaveSuccess("Business profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error while saving profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function generatePack() {
    if (!profile) return;
    setError(null);
    setGenerateSuccess(null);
    setIsGenerating(true);
    try {
      const response = await fetch("/api/business/generate-promo-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, businessProfileId: savedProfileId ?? undefined }),
      });
      const json = (await response.json()) as { promoPack?: PromoPack; error?: string };
      if (!response.ok || !json.promoPack) {
        throw new Error(json.error ?? "Promo pack generation failed.");
      }
      setPromoPack(json.promoPack);
      setGenerateSuccess("Promo pack generated. Your content is ready to post.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error while generating promo pack.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function copy(text: string, key: CopyKey) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1200);
  }

  const step = useMemo(() => {
    if (!profile) return 1;
    if (!promoPack) return 2;
    return 3;
  }, [profile, promoPack]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="cl-card p-6 md:p-7">
        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">Business Context Engine</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Turn your website into a promo content engine.</h1>
        <p className="mt-3 max-w-3xl text-slate-600">Paste your website and ClipLoop will learn your business, extract your offer, and generate ready-to-post short-form promo content.</p>
        <p className="mt-3 text-sm font-medium text-slate-800">Paste your website. ClipLoop learns your business. Generate ready to post promo content.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <StepBadge label="Step 1" title="Analyze website" active={step >= 1} complete={Boolean(profile)} />
        <StepBadge label="Step 2" title="Review business profile" active={step >= 2} complete={Boolean(savedProfileId)} />
        <StepBadge label="Step 3" title="Generate promo pack" active={step >= 3} complete={Boolean(promoPack)} />
      </section>

      <section className="cl-card p-5 md:p-6">
        <h2 className="text-xl font-semibold text-slate-950">Analyze website</h2>
        <p className="mt-1 text-sm text-slate-600">Enter your business website homepage URL.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://yourbusiness.com" className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
          <Button disabled={isAnalyzing || !websiteUrl.trim()} onClick={analyzeWebsite}>{isAnalyzing ? "Analyzing..." : "Analyze Website"}</Button>
        </div>
        {isAnalyzing ? <p className="mt-3 text-sm text-slate-600">Reading your website and building your business context...</p> : null}
        {analyzeSuccess ? <p className="mt-3 text-sm font-medium text-emerald-700">{analyzeSuccess}</p> : null}
      </section>

      {canEditProfile ? (
        <section className="cl-card p-5 md:p-6">
          <h2 className="text-xl font-semibold text-slate-950">Review business profile</h2>
          <p className="mt-1 text-sm text-slate-600">Edit anything before you save and generate your promo pack.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Business name" value={viewProfile.businessName} onChange={(value) => updateProfile("businessName", value)} />
            <Field label="Website URL" value={viewProfile.websiteUrl} onChange={(value) => updateProfile("websiteUrl", value)} />
            <Field label="Industry" value={viewProfile.industry} onChange={(value) => updateProfile("industry", value)} />
            <Field label="Target audience" value={viewProfile.targetAudience} onChange={(value) => updateProfile("targetAudience", value)} />
            <Field label="Main offer" value={viewProfile.mainOffer} onChange={(value) => updateProfile("mainOffer", value)} />
            <Field label="Brand tone" value={viewProfile.brandTone} onChange={(value) => updateProfile("brandTone", value)} />
            <Field label="One-line summary" value={viewProfile.oneLineSummary} onChange={(value) => updateProfile("oneLineSummary", value)} className="md:col-span-2" />
            <Field label="Long summary" value={viewProfile.longSummary} onChange={(value) => updateProfile("longSummary", value)} multiline className="md:col-span-2" />
            <ArrayTextarea label="Products or services" value={viewProfile.productsOrServices} onChange={(value) => updateProfile("productsOrServices", value)} />
            <ArrayTextarea label="Key benefits" value={viewProfile.keyBenefits} onChange={(value) => updateProfile("keyBenefits", value)} />
            <ArrayTextarea label="Pain points solved" value={viewProfile.painPointsSolved} onChange={(value) => updateProfile("painPointsSolved", value)} />
            <ArrayTextarea label="Content angles" value={viewProfile.contentAngles} onChange={(value) => updateProfile("contentAngles", value)} />
            <ArrayTextarea label="CTA ideas" value={viewProfile.ctaIdeas} onChange={(value) => updateProfile("ctaIdeas", value)} className="md:col-span-2" />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={saveProfile} disabled={isSaving}>{isSaving ? "Saving..." : "Save Business Profile"}</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={generatePack} disabled={isGenerating}>{isGenerating ? "Generating promo pack..." : "Generate Promo Pack"}</Button>
          </div>
          {!savedProfileId ? <p className="mt-3 text-xs text-slate-500">Save this profile to keep future promo packs connected to this business.</p> : null}
          {saveSuccess ? <p className="mt-3 text-sm font-medium text-emerald-700">{saveSuccess}</p> : null}
          {generateSuccess ? <p className="mt-3 text-sm font-medium text-emerald-700">{generateSuccess}</p> : null}
        </section>
      ) : (
        <section className="cl-card p-8 text-center">
          <p className="text-sm text-slate-500">No business profile yet. Start by analyzing your website.</p>
        </section>
      )}

      {error ? <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</section> : null}

      {promoPack ? <PromoPackView pack={promoPack} copy={copy} copiedKey={copiedKey} /> : null}
    </div>
  );
}

function StepBadge({ label, title, active, complete }: { label: string; title: string; active: boolean; complete: boolean }) {
  return <div className={`rounded-2xl border px-4 py-3 ${active ? "border-emerald-300 bg-emerald-50" : "bg-white"}`}><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-medium text-slate-900">{title}</p>{complete ? <p className="mt-1 text-xs text-emerald-700">Complete</p> : null}</div>;
}

function Field({ label, value, onChange, className = "", multiline = false }: { label: string; value: string; onChange: (value: string) => void; className?: string; multiline?: boolean }) {
  return <label className={`space-y-1 ${className}`}><span className="text-sm font-medium text-slate-700">{label}</span>{multiline ? <textarea className="min-h-24 w-full rounded-xl border px-3 py-2.5 text-sm" value={value} onChange={(event) => onChange(event.target.value)} /> : <input className="w-full rounded-xl border px-3 py-2.5 text-sm" value={value} onChange={(event) => onChange(event.target.value)} />}</label>;
}

function ArrayTextarea({ label, value, onChange, className = "" }: { label: string; value: string[]; onChange: (value: string[]) => void; className?: string }) {
  return <label className={`space-y-1 ${className}`}><span className="text-sm font-medium text-slate-700">{label}</span><textarea className="min-h-24 w-full rounded-xl border px-3 py-2.5 text-sm" value={value.join("\n")} onChange={(event) => onChange(event.target.value.split("\n").map((line) => line.trim()).filter(Boolean))} /><span className="text-xs text-slate-500">One item per line.</span></label>;
}

function CopyMini({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return <button onClick={onClick} className="rounded-lg border px-2 py-1 text-xs font-medium hover:bg-slate-50">{copied ? "Copied" : "Copy"}</button>;
}

function PromoPackView({ pack, copy, copiedKey }: { pack: PromoPack; copy: (text: string, key: string) => Promise<void>; copiedKey: string | null }) {
  return <section className="space-y-5"><div className="cl-card p-5"><h2 className="text-xl font-semibold">Campaign overview</h2><p className="mt-2 text-sm"><span className="font-medium">Campaign title:</span> {pack.campaignTitle}</p><p className="mt-1 text-sm"><span className="font-medium">Positioning angle:</span> {pack.positioningAngle}</p></div>
    <Section title="Short-form video ideas">{pack.shortFormVideoIdeas.map((idea, i)=><div key={i} className="rounded-xl border p-4 space-y-2"><div className="flex justify-between"><p className="font-semibold">{idea.title}</p><CopyMini copied={copiedKey===`video-${i}`} onClick={()=>copy([idea.title,idea.hook,idea.script,idea.caption,idea.cta].join("\n\n"),`video-${i}`)} /></div><p><b>Hook:</b> {idea.hook}</p><p><b>Script:</b> {idea.script}</p><p><b>Caption:</b> {idea.caption}</p><p><b>CTA:</b> {idea.cta}</p><div className="flex gap-2"><CopyMini copied={copiedKey===`hook-${i}`} onClick={()=>copy(idea.hook,`hook-${i}`)} /><CopyMini copied={copiedKey===`script-${i}`} onClick={()=>copy(idea.script,`script-${i}`)} /><CopyMini copied={copiedKey===`caption-${i}`} onClick={()=>copy(idea.caption,`caption-${i}`)} /></div></div>)}</Section>
    <Section title="X posts">{pack.xPosts.map((item,i)=><ContentCard key={i} text={item} onCopy={()=>copy(item,`x-${i}`)} copied={copiedKey===`x-${i}`} />)}</Section>
    <Section title="Instagram captions">{pack.instagramCaptions.map((item,i)=><ContentCard key={i} text={item} onCopy={()=>copy(item,`ig-${i}`)} copied={copiedKey===`ig-${i}`} />)}</Section>
    <Section title="TikTok/Reels captions">{pack.tiktokCaptions.map((item,i)=><ContentCard key={i} text={item} onCopy={()=>copy(item,`tt-${i}`)} copied={copiedKey===`tt-${i}`} />)}</Section>
    <Section title="Ad copy variants">{pack.adCopyVariants.map((item,i)=><ContentCard key={i} text={item} onCopy={()=>copy(item,`ad-${i}`)} copied={copiedKey===`ad-${i}`} />)}</Section>
    <Section title="7-day content calendar">{pack.contentCalendar.map((row,i)=><div key={i} className="rounded-xl border p-4"><div className="flex justify-between"><p className="font-semibold">{row.day} · {row.postType}</p><CopyMini copied={copiedKey===`cal-${i}`} onClick={()=>copy(`${row.day}\n${row.postType}\n${row.idea}\n${row.caption}\n${row.cta}`,`cal-${i}`)} /></div><p className="mt-2 text-sm"><b>Idea:</b> {row.idea}</p><p className="mt-1 text-sm"><b>Caption:</b> {row.caption}</p><p className="mt-1 text-sm"><b>CTA:</b> {row.cta}</p></div>)}</Section></section>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="cl-card p-5"><h3 className="text-lg font-semibold text-slate-900">{title}</h3><div className="mt-4 space-y-3">{children}</div></div>;
}

function ContentCard({ text, onCopy, copied }: { text: string; onCopy: () => void; copied: boolean }) {
  return <div className="rounded-xl border p-4"><div className="mb-2 flex justify-end"><CopyMini onClick={onCopy} copied={copied} /></div><p className="text-sm whitespace-pre-wrap">{text}</p></div>;
}
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Profile = any;
export default function BusinessPage(){const [websiteUrl,setWebsiteUrl]=useState("");const [profile,setProfile]=useState<Profile|null>(null);const [loading,setLoading]=useState(false);const [error,setError]=useState("");const [promoPack,setPromoPack]=useState<any>(null);const [savedId,setSavedId]=useState<string|undefined>();
const copy=async(v:string)=>navigator.clipboard.writeText(v);
async function analyze(){setLoading(true);setError("");try{const r=await fetch('/api/business/analyze-website',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({websiteUrl})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Analyze failed');setProfile(j.profile);}catch(e:any){setError(e.message);}finally{setLoading(false);}}
async function save(){const r=await fetch('/api/business/save-profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile})});const j=await r.json();if(r.ok) setSavedId(j.profile.id);}
async function generate(){setLoading(true);setError("");try{const r=await fetch('/api/business/generate-promo-pack',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile,businessProfileId:savedId})});const j=await r.json();if(!r.ok) throw new Error(j.error||'Failed');setPromoPack(j.promoPack);}catch(e:any){setError(e.message);}finally{setLoading(false);}}
return <div className='mx-auto max-w-5xl space-y-6'><div><h1 className='text-3xl font-semibold'>Turn your website into promo content.</h1><p className='text-slate-600 mt-2'>Paste your website. ClipLoop learns your business and generates ready to post short form promo content.</p></div><div className='cl-card p-4 space-y-3'><input className='w-full rounded-xl border p-3' placeholder='https://yourbusiness.com' value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)} /><Button onClick={analyze} disabled={loading}>{loading?'Analyzing...':'Analyze Website'}</Button>{error&&<p className='text-rose-600 text-sm'>{error}</p>}</div>{profile&&<div className='cl-card p-4 space-y-3'>{Object.entries(profile).map(([k,v])=><div key={k}><label className='text-sm font-medium'>{k}</label>{Array.isArray(v)?<textarea className='w-full border rounded p-2' value={v.join('\n')} onChange={e=>setProfile({...profile,[k]:e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)})}/>:<input className='w-full border rounded p-2' value={String(v??'')} onChange={e=>setProfile({...profile,[k]:e.target.value})}/>}</div>)}<div className='flex gap-2'><Button onClick={save}>Save Profile</Button><Button className='bg-slate-200 text-slate-900 hover:bg-slate-300' onClick={generate}>Generate Promo Pack</Button></div></div>}{promoPack&&<div className='cl-card p-4 space-y-4'><h2 className='text-xl font-semibold'>Latest Promo Pack</h2><pre className='text-xs whitespace-pre-wrap'>{JSON.stringify(promoPack,null,2)}</pre><Button onClick={()=>copy(JSON.stringify(promoPack,null,2))}>Copy Promo Pack</Button></div>}</div>}
