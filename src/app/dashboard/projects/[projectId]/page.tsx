import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton } from "@/components/dashboard/action-button";
import { ProjectSettingsForm } from "@/components/dashboard/project-settings-form";
import { UsageSummary } from "@/components/dashboard/usage-summary";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById } from "@/domains/projects/service";
import { getLatestStrategyCycleForProject } from "@/domains/strategy/service";
import { listContentItemsForStrategyCycle } from "@/domains/content-items/service";
import { getAssetsForContentItem } from "@/domains/rendering/service";
import { getProjectPerformanceTotals, getPerformanceForStrategyCycle } from "@/domains/performance/service";
import { getIterationExperimentsForStrategyCycle, getNextStrategyCycle } from "@/domains/iteration/service";
import { canAccessProduct, getCurrentUsageSummary } from "@/domains/account/service";
import { getProductReadinessSummary } from "@/domains/onboarding/service";
import { AccessGate } from "@/components/dashboard/access-gate";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  const access = await canAccessProduct(user.id);
  if (!access) return <AccessGate email={user.email} />;
  const project = await getProjectById(projectId, user.id);

  if (!project) notFound();

  const latestCycle = await getLatestStrategyCycleForProject(project.id);
  const latestPosts = latestCycle ? await listContentItemsForStrategyCycle(latestCycle.id) : [];
  const assets = await Promise.all(
    latestPosts.filter((post) => post.renderStatus === "completed").slice(0, 3).map((post) => getAssetsForContentItem(post.id)),
  );

  const publishSummary = {
    total: latestPosts.length,
    approved: latestPosts.filter((post) => !!post.approvedAt).length,
    scheduled: latestPosts.filter((post) => post.publishStatus === "scheduled").length,
    published: latestPosts.filter((post) => post.publishStatus === "published").length,
  };

  const perfProject = await getProjectPerformanceTotals(project.id);
  const latestWeekPerformance = latestCycle ? await getPerformanceForStrategyCycle(latestCycle.id) : [];
  const latestAnalysisSummary = latestCycle
    ? (
        await getIterationExperimentsForStrategyCycle(latestCycle.id)
      ).find((row) => (row.metadataJson as { type?: string } | null)?.type === "summary")?.inputSummary
    : null;
  const nextCycle = latestCycle ? await getNextStrategyCycle(project.id, latestCycle.id) : null;
  const usage = await getCurrentUsageSummary(user.id);
  const readiness = await getProductReadinessSummary(project.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{project.productName}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border bg-white p-4">
          <p>{project.description}</p>
          <p className="mt-2 text-sm text-slate-600">Audience: {project.audience}</p>
          <p className="text-sm text-slate-600">Goal: {project.goalType}</p>
          <p className="text-sm text-slate-600">Readiness: {readiness.score}</p>
        </div>
        <ProjectSettingsForm project={project} />
      </div>

      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Product readiness</h2>
        <ul className="mt-2 list-disc pl-5 text-sm">
          <li>Onboarding complete: {readiness.onboardingComplete ? "yes" : "no"}</li>
          <li>Strategy generated: {readiness.strategyGenerated ? "yes" : "no"}</li>
          <li>Content rendered: {readiness.rendered ? "yes" : "no"}</li>
          <li>Publish flow configured: {readiness.publishFlowConfigured ? "yes" : "no"}</li>
          <li>Tracking active: {readiness.trackingActive ? "yes" : "no"}</li>
        </ul>
      </section>

      <UsageSummary usage={usage.usage} limits={usage.limits} />

      <ActionButton endpoint={`/api/projects/${project.id}/generate-strategy`} label="Generate weekly strategy" />

      {latestCycle ? (
        <Link href={`/dashboard/projects/${project.id}/week/${latestCycle.id}`} className="inline-block rounded border bg-white px-3 py-2">
          View latest week
        </Link>
      ) : null}

      {assets.length > 0 ? (
        <section className="rounded border bg-white p-4">
          <h2 className="font-semibold">Latest rendered assets</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {assets.map((assetSet) =>
              assetSet.thumbnail ? (
                <a key={assetSet.thumbnail.id} href={assetSet.video?.storageUrl ?? assetSet.thumbnail.storageUrl}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetSet.thumbnail.storageUrl} alt="Rendered thumbnail" className="rounded border" />
                </a>
              ) : null,
            )}
          </div>
        </section>
      ) : null}

      {latestPosts.length > 0 ? (
        <section className="rounded border bg-white p-4">
          <h2 className="font-semibold">Publishing summary (latest week)</h2>
          <p className="mt-2 text-sm">Approved: {publishSummary.approved} / {publishSummary.total}</p>
          <p className="text-sm">Scheduled: {publishSummary.scheduled}</p>
          <p className="text-sm">Published: {publishSummary.published}</p>
        </section>
      ) : null}

      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Performance summary</h2>
        <p className="mt-2 text-sm">Total clicks: {perfProject.totalClicks}</p>
        <p className="text-sm">Total signups: {perfProject.totalSignups}</p>
        <p className="text-sm">Total revenue: {perfProject.totalRevenue}</p>
      </section>

      {latestWeekPerformance.length > 0 ? (
        <section className="rounded border bg-white p-4">
          <h2 className="font-semibold">Latest week performance snapshot</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="pr-3">Content Item</th>
                  <th className="pr-3">Clicks</th>
                  <th className="pr-3">Signups</th>
                  <th className="pr-3">Revenue</th>
                  <th className="pr-3">Score</th>
                  <th className="pr-3">Class</th>
                </tr>
              </thead>
              <tbody>
                {latestWeekPerformance.map((metric) => (
                  <tr key={metric.id} className="border-t">
                    <td className="pr-3">{metric.contentItemId.slice(0, 8)}...</td>
                    <td className="pr-3">{metric.clicks}</td>
                    <td className="pr-3">{metric.signups}</td>
                    <td className="pr-3">{metric.revenue}</td>
                    <td className="pr-3">{metric.score}</td>
                    <td className="pr-3">{metric.classification ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {(latestAnalysisSummary || nextCycle) ? (
        <section className="rounded border bg-white p-4">
          <h2 className="font-semibold">Iteration summary</h2>
          {latestAnalysisSummary ? <p className="mt-2 text-sm">{latestAnalysisSummary}</p> : null}
          {nextCycle ? (
            <Link className="mt-2 inline-block text-sm" href={`/dashboard/projects/${project.id}/week/${nextCycle.id}`}>
              Open next generated cycle ({nextCycle.weekStart.toISOString().slice(0, 10)})
            </Link>
          ) : (
            <p className="mt-2 text-sm text-slate-600">No next cycle generated yet.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
