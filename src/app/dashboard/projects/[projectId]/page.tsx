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
      <section className="cl-card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="cl-kicker uppercase tracking-widest text-slate-500">Project Profile</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{project.productName}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{project.oneLiner ?? project.description}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wider">
            <span className="cl-badge bg-slate-100 text-slate-600">Goal: {project.goalType}</span>
            {project.projectType ? <span className="cl-badge bg-slate-100 text-slate-600">Type: {project.projectType}</span> : null}
            <span className="cl-badge bg-blue-50 text-blue-700">Readiness: {readiness.score}</span>
            {latestCycle ? <span className="cl-badge bg-slate-100 text-slate-600">Week: {latestCycle.weekStart.toISOString().slice(0, 10)}</span> : null}
          </div>
        </div>
      </section>

      <section className="cl-card p-6">
        <div className="flex items-center justify-between border-b pb-4 cl-divider">
          <h2 className="text-lg font-semibold text-slate-950">Business context</h2>
          <span className="text-xs text-slate-500 italic">Saved profile for content generation</span>
        </div>
        <div className="mt-5 grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Brand Name" value={project.businessName ?? project.productName} />
          <DetailItem label="Category" value={project.businessCategory ?? project.niche} />
          <DetailItem label="Location" value={[project.city, project.state].filter(Boolean).join(", ")} />
          <DetailItem label="Target Audience" value={project.targetAudience ?? project.audience} />
          <DetailItem label="Primary Offer" value={project.primaryOffer ?? project.offer} />
          <DetailItem label="Price Range" value={project.priceRange} />
          <DetailItem label="Voice Tone" value={project.tone} />
          <DetailItem label="Call to Action" value={project.callToAction} />
          <DetailItem label="Website" value={project.websiteUrl} />
        </div>
        {project.businessDescription ? (
          <div className="mt-6 border-t pt-4 cl-divider">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Description</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{project.businessDescription}</p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="cl-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Workflow readiness</h2>
          <p className="mt-1 text-sm text-slate-600">Track the progress of your weekly content loop.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ReadinessItem label="Onboarding" value={readiness.onboardingComplete} />
            <ReadinessItem label="Strategy" value={readiness.strategyGenerated} />
            <ReadinessItem label="Render" value={readiness.rendered} />
            <ReadinessItem label="Publishing" value={readiness.publishFlowConfigured} />
            <ReadinessItem label="Tracking" value={readiness.trackingActive} />
            <ReadinessItem label="Weekly Pack" value={readiness.postsGenerated} />
          </div>
        </div>
        <ProjectSettingsForm project={project} />
      </section>

      <section className="cl-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-slate-950">Publishing channel</h2>
            <p className="mt-1 text-sm text-slate-600">Connect your platform handles to enable direct publishing and tracking.</p>
            <div className="mt-5 flex flex-col gap-2 text-sm">
              <p className="flex items-center justify-between border-b pb-2 cl-divider">
                <span className="font-medium text-slate-700">Platform</span>
                <span className="text-slate-950 uppercase text-[11px] font-semibold tracking-wider">Instagram</span>
              </p>
              <p className="flex items-center justify-between border-b pb-2 cl-divider">
                <span className="font-medium text-slate-700">Account</span>
                <span className="text-slate-950">{channelStatus.channel?.accountName ?? "Not connected"}</span>
              </p>
              <p className="flex items-center justify-between border-b pb-2 cl-divider">
                <span className="font-medium text-slate-700">Status</span>
                <span className={`font-semibold ${channelStatus.connected ? "text-emerald-600" : "text-slate-500"}`}>{channelStatus.status.replace(/_/g, " ")}</span>
              </p>
            </div>
            {channelStatus.reason ? <p className="mt-3 text-xs text-slate-500 italic">{channelStatus.reason}</p> : null}
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
        subtitle="Credits remaining in the current billing window."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Current week posts" value={latestPosts.length} />
        <MetricCard label="Ready for delivery" value={publishSummary.rendered} />
        <MetricCard label="Published" value={publishSummary.published} />
        <MetricCard label="Performance (C/S/R)" value={`${perfProject.totalClicks} / ${perfProject.totalSignups} / $${perfProject.totalRevenue}`} />
      </section>

      <section className="cl-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-slate-950">Next actions</h2>
            <p className="mt-1 text-sm text-slate-600">Move this project forward through the weekly loop.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {latestCycle ? (
              <Link href={`/dashboard/projects/${project.id}/week/${latestCycle.id}`} className="inline-flex rounded-xl border px-4 py-2 text-sm font-medium transition cl-divider hover:bg-slate-50">
                Open current week
              </Link>
            ) : null}
            {nextCycle ? (
              <Link href={`/dashboard/projects/${project.id}/week/${nextCycle.id}`} className="inline-flex rounded-xl border px-4 py-2 text-sm font-medium transition cl-divider hover:bg-slate-50">
                Open next cycle
              </Link>
            ) : null}
          </div>
        </div>
        <div className="mt-6 border-t pt-6 cl-divider">
          <ActionButton endpoint={`/api/projects/${project.id}/generate-strategy`} label={latestCycle ? "Refresh weekly strategy" : "Generate weekly strategy"} />
          <div className="mt-5 grid gap-4 text-[13px] leading-relaxed text-slate-600 sm:grid-cols-3">
            <div className="cl-card-soft p-4">
              <p className="font-semibold text-slate-950 mb-1">1. Strategy</p>
              If no strategy cycle exists, generate it to create your weekly angles.
            </div>
            <div className="cl-card-soft p-4">
              <p className="font-semibold text-slate-950 mb-1">2. Rendering</p>
              Once posts are generated, render the slideshows to prepare for delivery.
            </div>
            <div className="cl-card-soft p-4">
              <p className="font-semibold text-slate-950 mb-1">3. Feedback</p>
              After publishing, roll up results to inform next week's winners.
            </div>
          </div>
        </div>
      </section>

      {assets.length > 0 ? (
        <section className="cl-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Preview assets</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((assetSet) =>
              assetSet.thumbnail ? (
                <a key={assetSet.thumbnail.id} href={assetSet.video?.storageUrl ?? assetSet.thumbnail.storageUrl} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border transition-all cl-divider hover:border-slate-400">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetSet.thumbnail.storageUrl} alt="Rendered thumbnail" className="w-full transition-transform group-hover:scale-105" />
                </a>
              ) : null,
            )}
          </div>
        </section>
      ) : null}

      {latestWeekPerformance.length > 0 ? (
        <section className="cl-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Performance snapshot</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  <th className="pb-3 text-left">Post</th>
                  <th className="pb-3 text-left">Clicks</th>
                  <th className="pb-3 text-left">Signups</th>
                  <th className="pb-3 text-left">Revenue</th>
                  <th className="pb-3 text-left">Score</th>
                  <th className="pb-3 text-left text-right">Class</th>
                </tr>
              </thead>
              <tbody className="divide-y cl-divider">
                {latestWeekPerformance.map((metric) => (
                  <tr key={metric.id}>
                    <td className="py-3 font-medium text-slate-900">{metric.contentItemId.slice(0, 8)}</td>
                    <td className="py-3">{metric.clicks}</td>
                    <td className="py-3">{metric.signups}</td>
                    <td className="py-3 font-medium text-slate-950">${metric.revenue}</td>
                    <td className="py-3">{metric.score}</td>
                    <td className="py-3 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${metric.classification === "winner" ? "bg-emerald-50 text-emerald-700" : metric.classification === "loser" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                        {metric.classification ?? "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="cl-card p-6">
        <h2 className="text-lg font-semibold text-slate-950">Iteration state</h2>
        <div className="mt-4 border-t pt-4 cl-divider">
          {latestAnalysisSummary ? (
            <p className="text-sm leading-7 text-slate-700">{latestAnalysisSummary}</p>
          ) : (
            <p className="text-sm text-slate-600 italic">No iteration analysis yet. Publish content and roll up performance to see insights.</p>
          )}
          {nextCycle ? (
            <div className="mt-5">
              <Link className="inline-flex rounded-xl border bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" href={`/dashboard/projects/${project.id}/week/${nextCycle.id}`}>
                Open next cycle ({nextCycle.weekStart.toISOString().slice(0, 10)})
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-950">{value || "Not set"}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="cl-card p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}
}
