import { ProjectForm } from "@/components/dashboard/project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">New project</p>
        <h1 className="text-3xl font-bold">Set up a local business profile, then run the weekly loop</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Keep it simple: profile, audience, offer, channels, and style. The richer this context is, the more usable your generated short-form promos will be.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded border bg-white p-4 text-sm">
          <p className="font-medium">Step 1</p>
          <p className="mt-1 text-slate-600">Create the project and store business profile context.</p>
        </div>
        <div className="rounded border bg-white p-4 text-sm">
          <p className="font-medium">Step 2</p>
          <p className="mt-1 text-slate-600">Generate this week’s strategy and turn it into 5 short-form drafts.</p>
        </div>
        <div className="rounded border bg-white p-4 text-sm">
          <p className="font-medium">Step 3</p>
          <p className="mt-1 text-slate-600">Render, approve, schedule, publish, then track performance and iterate.</p>
        </div>
      </div>

      <ProjectForm />
    </div>
  );
}
