import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listProjectsForUser } from "@/domains/projects/service";
import { AccessGate } from "@/components/dashboard/access-gate";
import { UsageSummary } from "@/components/dashboard/usage-summary";
import { canAccessProduct, getCurrentUsageSummary, getUserPlanState } from "@/domains/account/service";
import { getLatestStrategyCycleForProject } from "@/domains/strategy/service";
import { listContentItemsForStrategyCycle } from "@/domains/content-items/service";
import { getProjectPerformanceTotals } from "@/domains/performance/service";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const state = await getUserPlanState(user.id);
  const access = await canAccessProduct(user.id);

  if (!access) {
    return <AccessGate email={user.email} />;
  }

  const projects = await listProjectsForUser(user.id);
  const usage = await getCurrentUsageSummary(user.id);
  const activeProject = projects[0] ?? null;
  const latestCycle = activeProject ? await getLatestStrategyCycleForProject(activeProject.id) : null;
  const latestPosts = latestCycle ? await listContentItemsForStrategyCycle(latestCycle.id) : [];
  const perf = activeProject ? await getProjectPerformanceTotals(activeProject.id) : { totalClicks: 0, totalSignups: 0, totalRevenue: 0 };

  return (
    <div className="space-y-6">
      <div className="rounded border bg-white p-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Signed in as {user.email}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded bg-slate-100 px-2 py-1">Plan: {state.effectivePlan}</span>
          <span className="rounded bg-slate-100 px-2 py-1">Billing: {state.billingStatus}</span>
          <span className="rounded bg-slate-100 px-2 py-1">Beta approved: {state.isBetaApproved ? "yes" : "no"}</span>
        </div>
      </div>

      <UsageSummary usage={usage.usage} limits={usage.limits} />

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded border bg-white p-4 text-sm">Projects: {projects.length}</div>
        <div className="rounded border bg-white p-4 text-sm">Current week posts: {latestPosts.length}</div>
        <div className="rounded border bg-white p-4 text-sm">Published items: {latestPosts.filter((p) => p.publishStatus === "published").length}</div>
        <div className="rounded border bg-white p-4 text-sm">Clicks: {perf.totalClicks}</div>
        <div className="rounded border bg-white p-4 text-sm">Signups: {perf.totalSignups}</div>
        <div className="rounded border bg-white p-4 text-sm">Revenue: {perf.totalRevenue}</div>
      </section>

      <div className="flex gap-3">
        <Link href="/dashboard/projects/new" className="inline-block rounded bg-slate-900 px-3 py-2 text-white">
          Create project
        </Link>
        {activeProject ? (
          <Link href={`/dashboard/projects/${activeProject.id}`} className="inline-block rounded border bg-white px-3 py-2">
            Open active project
          </Link>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <div className="rounded border bg-white p-4 text-slate-600">No projects yet. Start by creating your first project.</div>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <Link key={project.id} className="rounded border bg-white p-4" href={`/dashboard/projects/${project.id}`}>
              <h2 className="font-semibold">{project.productName}</h2>
              <p className="text-sm text-slate-600">{project.oneLiner ?? project.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
