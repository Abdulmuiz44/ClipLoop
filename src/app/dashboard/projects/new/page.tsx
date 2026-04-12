import { ProjectForm } from "@/components/dashboard/project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Create your first ClipLoop project</h1>
      <p className="text-sm text-slate-600">
        Add enough context for strategy generation now. You can tweak voice, offer, and CTA later from project settings.
      </p>
      <ProjectForm />
    </div>
  );
}
