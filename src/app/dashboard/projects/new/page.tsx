import { ProjectForm } from "@/components/dashboard/project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="cl-kicker">New project</p>
        <h1 className="text-3xl font-semibold tracking-tight">Set up a local business profile, then run the weekly loop</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Keep it simple: profile, audience, offer, channels, and style. The richer this context is, the more usable your generated short-form promos will be.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="cl-card p-4 text-sm md:p-5">
          <p className="font-medium">Step 1</p>
          <p className="mt-1 text-slate-600">Create the project and store business profile context.</p>
        </div>
        <div className="cl-card p-4 text-sm md:p-5">
          <p className="font-medium">Step 2</p>
          <p className="mt-1 text-slate-600">Generate this week’s strategy and turn it into 5 short-form drafts.</p>
        </div>
        <div className="cl-card p-4 text-sm md:p-5">
          <p className="font-medium">Step 3</p>
          <p className="mt-1 text-slate-600">Render, approve, schedule, publish, then track performance and iterate.</p>
        </div>
      </div>

      <ProjectForm />
    </div>
  );
}
