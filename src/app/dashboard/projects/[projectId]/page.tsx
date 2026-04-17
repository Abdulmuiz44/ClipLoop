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
import { getProjectChannelStatus } from "@/domains/channels/service";
import { ChannelConnectButton } from "@/components/dashboard/channel-connect-button";
import { ChannelDisconnectButton } from "@/components/dashboard/channel-disconnect-button";
import { normalizeProjectChannels } from "@/lib/utils/channels";

function ReadinessItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div className={`rounded border px-3 py-3 text-sm ${value ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-slate-600">{value ? "Ready" : "Still missing"}</p>
    </div>
  );
}

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
  const channelStatus = await getProjectChannelStatus(project.id);
  const preferredChannels = normalizeProjectChannels(project.preferredChannelsJson, project.preferredChannels);

  const publishSummary = {
    total: latestPosts.length,
    approved: latestPosts.filter((post) => !!post.approvedAt).length,
    scheduled: latestPosts.filter((post) => post.publishStatus === "scheduled").length,
    published: latestPosts.filter((post) => post.publishStatus === "published").length,
    rendered: latestPosts.filter((post) => post.renderStatus === "completed").length,
  };

  return (
    <div className="space-y-6">
      <section className="rounded border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Project</p>
            <h1 className="mt-1 text-3xl font-bold">{project.productName}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{project.oneLiner ?? project.description}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1">Goal: {project.goalType}</span>
            {project.projectType ? <span className="rounded-full bg-slate-100 px-3 py-1">Type: {project.projectType}</span> : null}
            {project.languageStyle ? <span className="rounded-full bg-slate-100 px-3 py-1">Language: {project.languageStyle}</span> : null}
            <span className="rounded-full bg-slate-100 px-3 py-1">Readiness: {readiness.score}</span>
            {latestCycle ? <span className="rounded-full bg-slate-100 px-3 py-1">Current cycle: {latestCycle.weekStart.toISOString().slice(0, 10)}</span> : null}
          </div>
        </div>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Business profile</h2>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          <p>
            <strong>Name:</strong> {project.businessName ?? project.productName}
          </p>
          <p>
            <strong>Category:</strong> {project.businessCategory ?? project.niche}
          </p>
          <p>
            <strong>Location:</strong> {[project.city, project.state].filter(Boolean).join(", ") || "Not set"}
          </p>
          <p>
            <strong>Target audience:</strong> {project.targetAudience ?? project.audience}
          </p>
          <p>
            <strong>Primary offer:</strong> {project.primaryOffer ?? project.offer}
          </p>
          <p>
            <strong>Price range:</strong> {project.priceRange ?? "Not set"}
          </p>
          <p>
            <strong>Tone:</strong> {project.tone ?? "Not set"}
          </p>
          <p>
            <strong>Call to action:</strong> {project.callToAction ?? "Use default CTA URL"}
          </p>
          <p>
            <strong>Preferred channels:</strong> {preferredChannels.join(", ")}
          </p>
          <p>
            <strong>Instagram:</strong> {project.instagramHandle ?? "Not set"}
          </p>
          <p>
            <strong>WhatsApp:</strong> {project.whatsappNumber ?? "Not set"}
          </p>
          <p>
            <strong>Website:</strong> {project.websiteUrl ?? "Not set"}
          </p>
        </div>
        {project.businessDescription ? <p className="mt-3 text-sm text-slate-700">{project.businessDescription}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded border bg-white p-4">
          <h2 className="font-semibold">Workflow status</h2>
          <p className="mt-1 text-sm text-slate-600">This should make it obvious what is ready and what still blocks the weekly loop.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ReadinessItem label="Onboarding complete" value={readiness.onboardingComplete} />
            <ReadinessItem label="Strategy generated" value={readiness.strategyGenerated} />
            <ReadinessItem label="Content rendered" value={readiness.rendered} />
            <ReadinessItem label="Publish flow configured" value={readiness.publishFlowConfigured} />
            <ReadinessItem label="Tracking active" value={readiness.trackingActive} />
            <ReadinessItem label="Weekly pack exists" value={readiness.postsGenerated} />
          </div>
        </div>
        <ProjectSettingsForm project={project} />
      </section>

      <section className="rounded border bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Publishing channel</h2>
            <p className="mt-1 text-sm text-slate-600">Instagram is the first real publishing channel. Mock publishing is used only in local/dev fallback mode.</p>
            <p className="mt-2 text-sm">
              <strong>Status:</strong> {channelStatus.status}
            </p>
            <p className="mt-1 text-sm">
              <strong>Platform:</strong> instagram
            </p>
            <p className="mt-1 text-sm">
              <strong>Account:</strong> {channelStatus.channel?.accountName ?? "Not connected"}
            </p>
            <p className="mt-1 text-sm text-slate-600">{channelStatus.reason}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!channelStatus.connected || channelStatus.status === "disconnected" ? (
              <ChannelConnectButton projectId={project.id} label="Connect Instagram" />
            ) : channelStatus.status === "expired" || channelStatus.status === "invalid" ? (
              <ChannelConnectButton projectId={project.id} label="Reconnect Instagram" />
            ) : null}
            {channelStatus.connected ? <ChannelDisconnectButton projectId={project.id} /> : null}
          </div>
        </div>
      </section>

      <UsageSummary
        usage={usage.usage}
        limits={usage.limits}
        remaining={usage.remaining}
        subtitle="These are account-level hard caps for the starter and beta MVP."
      />

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded border bg-white p-4 text-sm">
          <p className="text-slate-500">Posts in latest week</p>
          <p className="mt-2 text-2xl font-semibold">{latestPosts.length}</p>
        </div>
        <div className="rounded border bg-white p-4 text-sm">
          <p className="text-slate-500">Rendered</p>
          <p className="mt-2 text-2xl font-semibold">{publishSummary.rendered}</p>
        </div>
        <div className="rounded border bg-white p-4 text-sm">
          <p className="text-slate-500">Scheduled / published</p>
          <p className="mt-2 text-2xl font-semibold">
            {publishSummary.scheduled} / {publishSummary.published}
          </p>
        </div>
        <div className="rounded border bg-white p-4 text-sm">
          <p className="text-slate-500">Clicks / signups / revenue</p>
          <p className="mt-2 text-xl font-semibold">
            {perfProject.totalClicks} / {perfProject.totalSignups} / {perfProject.totalRevenue}
          </p>
        </div>
      </section>

      <section className="rounded border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Next action</h2>
            <p className="mt-1 text-sm text-slate-600">Move the project into the next weekly step instead of hunting through settings.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {latestCycle ? (
              <Link href={`/dashboard/projects/${project.id}/week/${latestCycle.id}`} className="inline-flex rounded border bg-white px-3 py-2 text-sm">
                Open latest week
              </Link>
            ) : null}
            {nextCycle ? (
              <Link href={`/dashboard/projects/${project.id}/week/${nextCycle.id}`} className="inline-flex rounded border bg-white px-3 py-2 text-sm">
                Open next generated cycle
              </Link>
            ) : null}
            <Link href="/dashboard/settings" className="inline-flex rounded border bg-white px-3 py-2 text-sm">
              Account and limits
            </Link>
          </div>
        </div>
        <div className="mt-4">
          <ActionButton endpoint={`/api/projects/${project.id}/generate-strategy`} label={latestCycle ? "Refresh current weekly strategy" : "Generate weekly strategy"} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded border border-slate-200 bg-slate-50 p-3">If there is no strategy yet, generate the week first.</div>
          <div className="rounded border border-slate-200 bg-slate-50 p-3">If posts exist but nothing is rendered, run the render step next.</div>
          <div className="rounded border border-slate-200 bg-slate-50 p-3">Once posts are published, roll up performance and generate the next cycle.</div>
        </div>
      </section>

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

      {latestWeekPerformance.length > 0 ? (
        <section className="rounded border bg-white p-4">
          <h2 className="font-semibold">Performance snapshot</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="pr-3 text-left">Content item</th>
                  <th className="pr-3 text-left">Clicks</th>
                  <th className="pr-3 text-left">Signups</th>
                  <th className="pr-3 text-left">Revenue</th>
                  <th className="pr-3 text-left">Score</th>
                  <th className="pr-3 text-left">Class</th>
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

      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Iteration state</h2>
        {latestAnalysisSummary ? <p className="mt-2 text-sm">{latestAnalysisSummary}</p> : <p className="mt-2 text-sm text-slate-600">No iteration analysis yet. Publish content, roll up outcomes, then analyze the current week.</p>}
        {nextCycle ? (
          <Link className="mt-3 inline-flex rounded border px-3 py-2 text-sm" href={`/dashboard/projects/${project.id}/week/${nextCycle.id}`}>
            Open next generated cycle ({nextCycle.weekStart.toISOString().slice(0, 10)})
          </Link>
        ) : null}
      </section>
    </div>
  );
}
