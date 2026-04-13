import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listProjectsForUser } from "@/domains/projects/service";
import { AccessGate } from "@/components/dashboard/access-gate";
import { UsageSummary } from "@/components/dashboard/usage-summary";
import { canAccessProduct, getCurrentUsageSummary, getUserPlanState } from "@/domains/account/service";
import { getLatestStrategyCycleForProject } from "@/domains/strategy/service";
import { listContentItemsForStrategyCycle } from "@/domains/content-items/service";
import { getProjectPerformanceTotals } from "@/domains/performance/service";
import { getProductReadinessSummary } from "@/domains/onboarding/service";

function StatCard({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "good" }) {
  return (
    <div className={`rounded border p-4 text-sm ${tone === "good" ? "border-emerald-200 bg-emerald-50" : "bg-white"}`}>
      <p className="text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

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
  const readiness = activeProject ? await getProductReadinessSummary(activeProject.id) : null;

  return (
    <div className="space-y-6">
      <section className="rounded border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
            <h1 className="mt-1 text-3xl font-bold">Ship the weekly ClipLoop</h1>
            <p className="mt-2 text-sm text-slate-600">Signed in as {user.email}. Keep the workflow narrow: create one project, generate one weekly pack, then learn from what converts.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1">Plan: {state.effectivePlan}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">Billing: {state.billingStatus}</span>
            <span className={`rounded-full px-3 py-1 ${state.isBetaApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {state.isBetaApproved ? "Beta approved" : "Invite pending"}
            </span>
          </div>
        </div>
      </section>

      <UsageSummary
        usage={usage.usage}
        limits={usage.limits}
        remaining={usage.remaining}
        subtitle={`Current week ${usage.periods.week.start} to ${usage.periods.week.end}. Current month ${usage.periods.month.start} to ${usage.periods.month.end}.`}
      />

      <section className="grid gap-3 md:grid-cols-3">
        <StatCard label="Projects" value={projects.length} />
        <StatCard label="Current week posts" value={latestPosts.length} />
        <StatCard label="Published items" value={latestPosts.filter((post) => post.publishStatus === "published").length} />
        <StatCard label="Clicks" value={perf.totalClicks} />
        <StatCard label="Signups" value={perf.totalSignups} />
        <StatCard label="Revenue" value={perf.totalRevenue} tone={perf.totalRevenue > 0 ? "good" : "default"} />
      </section>

      <section className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded border bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Current focus</h2>
              <p className="mt-1 text-sm text-slate-600">Keep one active project moving through the weekly pipeline.</p>
            </div>
            <Link href="/dashboard/projects/new" className="inline-flex rounded bg-slate-900 px-3 py-2 text-sm text-white">
              Create project
            </Link>
          </div>

          {activeProject ? (
            <div className="mt-4 space-y-3 rounded border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm text-slate-500">Active project</p>
                <h3 className="text-xl font-semibold">{activeProject.productName}</h3>
                <p className="mt-1 text-sm text-slate-600">{activeProject.oneLiner ?? activeProject.description}</p>
              </div>
              {readiness ? (
                <div className="grid gap-2 md:grid-cols-2 text-sm">
                  <div className="rounded border border-slate-200 bg-white p-3">Readiness score: {readiness.score}</div>
                  <div className="rounded border border-slate-200 bg-white p-3">Latest cycle: {latestCycle ? latestCycle.weekStart.toISOString().slice(0, 10) : "not started"}</div>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Link href={`/dashboard/projects/${activeProject.id}`} className="inline-flex rounded border bg-white px-3 py-2 text-sm">
                  Open active project
                </Link>
                {latestCycle ? (
                  <Link href={`/dashboard/projects/${activeProject.id}/week/${latestCycle.id}`} className="inline-flex rounded border bg-white px-3 py-2 text-sm">
                    Open current week
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No project yet. Create your first project, then generate a strategy cycle and a 5-post pack.
            </div>
          )}
        </div>

        <div className="rounded border bg-white p-5">
          <h2 className="font-semibold">MVP constraints</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>One active project per account.</li>
            <li>One connected channel in the current plan model.</li>
            <li>5 posts per week and 20 per month.</li>
            <li>3 manual regenerations per week.</li>
            <li>20 renders and 20 publishes per month.</li>
          </ul>
        </div>
      </section>

      {projects.length > 0 ? (
        <section className="grid gap-3">
          {projects.map((project) => (
            <Link key={project.id} className="rounded border bg-white p-4" href={`/dashboard/projects/${project.id}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{project.productName}</h2>
                  <p className="text-sm text-slate-600">{project.oneLiner ?? project.description}</p>
                </div>
                <span className="text-sm text-slate-500">Open</span>
              </div>
            </Link>
          ))}
        </section>
      ) : null}
    </div>
  );
}
