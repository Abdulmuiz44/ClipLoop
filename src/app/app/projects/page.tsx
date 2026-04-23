import Link from "next/link";
import { StudioShell } from "@/components/app/studio-shell";
import { getCurrentUser } from "@/lib/auth";
import { listProjectsForUser } from "@/domains/projects/service";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const projects = await listProjectsForUser(user.id);

  return (
    <StudioShell title="Projects" subtitle="Your business and creator workspaces.">
      {projects.length === 0 ? (
        <div className="cl-card p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">No projects yet</p>
          <p className="mt-2 text-sm text-slate-600">Create your first project to unlock strategy, generation, and rendering.</p>
          <Link href="/dashboard/projects/new" className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Create project</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="cl-card p-5 transition hover:border-slate-400">
              <p className="text-lg font-semibold text-slate-950">{project.productName}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{project.projectType ?? "business"}</p>
              <p className="mt-3 line-clamp-3 text-sm text-slate-600">{project.oneLiner ?? project.description}</p>
              <p className="mt-4 text-xs text-slate-500">Updated {project.updatedAt.toISOString().slice(0, 10)}</p>
            </Link>
          ))}
        </div>
      )}
    </StudioShell>
  );
}
