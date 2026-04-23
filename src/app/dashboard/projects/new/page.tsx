import { ProjectForm } from "@/components/dashboard/project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="cl-kicker font-bold tracking-widest text-slate-500 uppercase">Project Setup</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.5rem]">Create a new project workspace</h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          Define your brand identity, target audience, and primary offers. This context ensures every generated promo fits your voice and growth goals.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="cl-card-soft p-5 text-sm">
          <p className="font-bold text-slate-950 uppercase tracking-wider text-[10px] mb-2">Step 1</p>
          <p className="font-semibold text-slate-950">Brand Profile</p>
          <p className="mt-1 text-slate-600 leading-relaxed">Save your business context, preferred channels, and voice tone.</p>
        </div>
        <div className="cl-card-soft p-5 text-sm">
          <p className="font-bold text-slate-950 uppercase tracking-wider text-[10px] mb-2">Step 2</p>
          <p className="font-semibold text-slate-950">Strategy</p>
          <p className="mt-1 text-slate-600 leading-relaxed">Generate your weekly promo angles and first 5-post content pack.</p>
        </div>
        <div className="cl-card-soft p-5 text-sm">
          <p className="font-bold text-slate-950 uppercase tracking-wider text-[10px] mb-2">Step 3</p>
          <p className="font-semibold text-slate-950">Delivery</p>
          <p className="mt-1 text-slate-600 leading-relaxed">Render videos, schedule posts, and track conversions to iterate.</p>
        </div>
      </div>

      <ProjectForm />
    </div>
  );
}
