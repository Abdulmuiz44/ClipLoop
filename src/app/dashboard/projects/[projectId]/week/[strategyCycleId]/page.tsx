import { notFound } from "next/navigation";
import { ActionButton } from "@/components/dashboard/action-button";
import { RenderButton } from "@/components/dashboard/render-button";
import { ScheduleItemControl } from "@/components/dashboard/schedule-item-control";
import { BulkScheduleControl } from "@/components/dashboard/bulk-schedule-control";
import { RunJobsButton } from "@/components/dashboard/run-jobs-button";
import { CopyButton } from "@/components/dashboard/copy-button";
import { TargetChannelControl } from "@/components/dashboard/target-channel-control";
import { PublishStrategyControl } from "@/components/dashboard/publish-strategy-control";
import { ExportBundleButton } from "@/components/dashboard/export-bundle-button";
import { getCurrentUser } from "@/lib/auth";
import { canAccessProduct } from "@/domains/account/service";
import { AccessGate } from "@/components/dashboard/access-gate";
import { getProjectById } from "@/domains/projects/service";
import { getStrategyCycleById } from "@/domains/strategy/service";
import { listContentItemsForStrategyCycle } from "@/domains/content-items/service";
import { getAssetsForContentItem } from "@/domains/rendering/service";
import { getJobsForStrategyCycle } from "@/domains/publishing/service";
import { getPerformanceForStrategyCycle } from "@/domains/performance/service";
import { getIterationExperimentsForStrategyCycle, getNextStrategyCycle } from "@/domains/iteration/service";
import { resolveContentItemTargetChannel } from "@/lib/utils/channels";

function renderBadge(status: string) {
  if (status === "completed") return <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700">Rendered</span>;
  if (status === "rendering") return <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700">Rendering</span>;
  if (status === "failed") return <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">Render Failed</span>;
  return <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">Render Pending</span>;
}

function publishBadge(status: string) {
  if (status === "published") return <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700">Published</span>;
  if (status === "publishing") return <span className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-700">Publishing</span>;
  if (status === "scheduled") return <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">Scheduled</span>;
  if (status === "approved") return <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">Approved</span>;
  if (status === "failed") return <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">Publish Failed</span>;
  return <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">Draft</span>;
}

export default async function WeekPage({
  params,
}: {
  params: Promise<{ projectId: string; strategyCycleId: string }>;
}) {
  const { projectId, strategyCycleId } = await params;

  const user = await getCurrentUser();
  const access = await canAccessProduct(user.id);
  if (!access) return <AccessGate email={user.email} />;
  const project = await getProjectById(projectId, user.id);
  if (!project) notFound();

  const cycle = await getStrategyCycleById(strategyCycleId);
  if (!cycle || cycle.projectId !== project.id) notFound();

  const posts = await listContentItemsForStrategyCycle(cycle.id);
  const angles = (cycle.anglesJson as Array<Record<string, string>>) ?? [];
  const assetsByPost = await Promise.all(posts.map((post) => getAssetsForContentItem(post.id)));
  const jobs = await getJobsForStrategyCycle(cycle.id);
  const latestJobByContentId = new Map<string, { job: (typeof jobs)[number]; payload: { contentItemId?: string; publishMode?: string } }>();
  for (const job of jobs) {
    const payload = job.payloadJson as { contentItemId?: string; publishMode?: string };
    if (!payload.contentItemId) continue;
    if (!latestJobByContentId.has(payload.contentItemId)) {
      latestJobByContentId.set(payload.contentItemId, { job, payload });
    }
  }
  const performance = await getPerformanceForStrategyCycle(cycle.id);
  const perfByContentId = new Map(performance.map((metric) => [metric.contentItemId, metric]));
  const iterationExperiments = await getIterationExperimentsForStrategyCycle(cycle.id);
  const nextCycle = await getNextStrategyCycle(project.id, cycle.id);
  const nextCyclePosts = nextCycle ? await listContentItemsForStrategyCycle(nextCycle.id) : [];

  const summaryExperiment = iterationExperiments.find((exp) => (exp.metadataJson as { type?: string } | null)?.type === "summary");
  const loserExperiments = iterationExperiments.filter((exp) => (exp.metadataJson as { type?: string } | null)?.type === "loser");
  const hookExperiments = iterationExperiments.filter((exp) => exp.mutationType === "hook");
  const angleExperiments = iterationExperiments.filter((exp) => exp.mutationType === "angle");
  const anglesToStop = (() => {
    if (!summaryExperiment?.resultSummary) return [];
    try {
      const parsed = JSON.parse(summaryExperiment.resultSummary) as { angles_to_stop?: string[] };
      return parsed.angles_to_stop ?? [];
    } catch {
      return [];
    }
  })();

  const trackingSnippet = `<script src="https://YOUR_DOMAIN/api/tracking/script.js" defer></script>`;

  return (
    <div className="space-y-6">
      <section className="cl-card p-6 md:p-8">
        <p className="cl-kicker font-bold tracking-widest text-slate-500 uppercase">Weekly Cycle</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Week of {new Date(cycle.weekStart).toLocaleDateString()}</h1>
      </section>

      <section className="cl-card p-6">
        <h2 className="text-lg font-semibold text-slate-950">Strategy summary</h2>
        <p className="mt-3 text-base leading-7 text-slate-700">{cycle.strategySummary ?? "No strategy summary available for this week."}</p>
        
        <div className="mt-6 border-t pt-5 cl-divider">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Weekly Angles</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {angles.map((angle) => (
              <li key={angle.angle_id} className="cl-card-soft p-4 text-sm leading-relaxed">
                <p className="font-semibold text-slate-950 mb-1">{angle.angle_name}</p>
                <p className="text-slate-600">{angle.core_claim}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {posts.length === 0 ? (
        <section className="cl-card p-8 text-center">
          <p className="cl-kicker">No content generated</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">Ready to build the pack?</h2>
          <p className="mx-auto mt-3 max-w-md text-slate-600 mb-6">Generate the first batch of 5 promo posts based on this week's strategy.</p>
          <ActionButton endpoint={`/api/strategy-cycles/${cycle.id}/generate-posts`} label="Generate 5-post pack" />
        </section>
      ) : (
        <>
          <section className="cl-card p-6">
            <h2 className="text-lg font-semibold text-slate-950">Workflow controls</h2>
            <p className="mt-1 text-sm text-slate-600">Execute batch actions for the entire weekly cycle.</p>
            
            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <ActionButton endpoint={`/api/strategy-cycles/${cycle.id}/approve`} label="Approve all" />
              <RenderButton endpoint={`/api/strategy-cycles/${cycle.id}/render`} label="Render all" compact />
              <ActionButton endpoint={`/api/strategy-cycles/${cycle.id}/rollup`} label="Roll up metrics" />
              <ActionButton endpoint={`/api/strategy-cycles/${cycle.id}/analyze`} label="Analyze results" />
              <ActionButton endpoint={`/api/strategy-cycles/${cycle.id}/generate-next`} label="Generate next" />
              <RunJobsButton />
            </div>

            <div className="mt-8 border-t pt-6 cl-divider">
              <div className="max-w-xl">
                <h3 className="text-sm font-semibold text-slate-950">Bulk scheduling</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Bulk scheduling applies to Instagram-targeted items. TikTok and WhatsApp remain manual export-first in the current workflow.
                </p>
                <div className="mt-4">
                  <BulkScheduleControl endpoint={`/api/strategy-cycles/${cycle.id}/schedule`} />
                </div>
              </div>
            </div>
          </section>

          <section className="cl-card p-6">
            <h2 className="text-lg font-semibold text-slate-950">Iteration analysis</h2>
            <p className="mt-2 text-sm leading-7 text-slate-700">{summaryExperiment?.inputSummary ?? 'Performance insights will appear here once you "Analyze results".'}</p>

            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4 border-t pt-6 cl-divider">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-3">Winners</h3>
                <ul className="space-y-3">
                  {angleExperiments.length === 0 ? (
                    <li className="text-xs text-slate-400 italic">None identified yet</li>
                  ) : (
                    angleExperiments.map((exp) => (
                      <li key={exp.id} className="text-xs leading-relaxed text-slate-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                        {exp.hypothesis}
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-rose-600 mb-3">Losers</h3>
                <ul className="space-y-3">
                  {loserExperiments.length === 0 ? (
                    <li className="text-xs text-slate-400 italic">None identified yet</li>
                  ) : (
                    loserExperiments.map((exp) => (
                      <li key={exp.id} className="text-xs leading-relaxed text-slate-700 bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                        {exp.inputSummary}
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-3">Refinements</h3>
                <ul className="space-y-3">
                  {hookExperiments.length === 0 ? (
                    <li className="text-xs text-slate-400 italic">None identified yet</li>
                  ) : (
                    hookExperiments.map((exp) => (
                      <li key={exp.id} className="text-xs leading-relaxed text-slate-700 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                        {exp.inputSummary}
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">Stop list</h3>
                <ul className="space-y-3">
                  {anglesToStop.length === 0 ? (
                    <li className="text-xs text-slate-400 italic">None identified yet</li>
                  ) : (
                    anglesToStop.map((angle) => (
                      <li key={angle} className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 line-through decoration-slate-300">
                        {angle}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            {nextCycle ? (
              <div className="mt-8 rounded-2xl border border-slate-900 bg-slate-950 p-5 text-white shadow-lg">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Next Iteration</p>
                    <h3 className="mt-1 font-semibold">Future cycle generated</h3>
                  </div>
                  <a className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-slate-200" href={`/dashboard/projects/${project.id}/week/${nextCycle.id}`}>
                    Open next week
                  </a>
                </div>
                {nextCyclePosts.length > 0 ? (
                  <div className="mt-4 grid gap-2">
                    {nextCyclePosts.map((post) => (
                      <div key={post.id} className="text-[11px] text-slate-400 flex items-center justify-between border-b border-white/10 pb-2">
                        <span>{post.internalTitle}</span>
                        {post.parentContentItemId ? <span className="text-[9px] uppercase tracking-tighter opacity-60">Derived from {post.parentContentItemId.slice(0, 8)}</span> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="grid gap-6">
            {posts.map((post, index) => {
              const assets = assetsByPost[index];
              const perf = perfByContentId.get(post.id);
              const trackingLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/r/${post.trackingSlug}`;
              const targetChannel = resolveContentItemTargetChannel(post.targetChannel, post.platform);
              const channelCaptions = (post.channelCaptionsJson as Record<string, string> | null) ?? {};
              const channelCtas = (post.channelCtaTextJson as Record<string, string> | null) ?? {};
              const previewCaption = channelCaptions[targetChannel] ?? post.caption;
              const previewCta = channelCtas[targetChannel] ?? post.ctaText;
              const publishStrategy = (post.publishStrategy as "direct_instagram" | "manual_export" | null) ?? "manual_export";
              const canDirectPublish = targetChannel === "instagram" && publishStrategy === "direct_instagram";
              const latestJob = latestJobByContentId.get(post.id);
              const publishMode =
                latestJob?.payload.publishMode ??
                (post.externalPostUrl?.includes("/mock/") || post.externalPostId?.startsWith("mock-post-") ? "mock" : post.externalPostId ? "instagram" : "n/a");

              return (
                <article key={post.id} className="cl-card overflow-hidden">
                  <div className="flex flex-col lg:flex-row">
                    <div className="flex-1 p-6 md:p-8 space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5 cl-divider">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Post {index + 1}</p>
                          <h3 className="mt-1 text-xl font-bold text-slate-950">{post.internalTitle}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {renderBadge(post.renderStatus)}
                          {publishBadge(post.publishStatus)}
                          {post.approvedAt ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">Approved</span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">Draft</span>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Hook</p>
                            <p className="text-sm font-medium leading-relaxed text-slate-950">{post.hook}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Slides</p>
                            <ol className="space-y-2 text-sm text-slate-700">
                              {((post.slidesJson as string[]) ?? []).map((slide, i) => (
                                <li key={slide} className="flex gap-2">
                                  <span className="font-bold text-slate-300">{i + 1}.</span>
                                  {slide}
                                </li>
                              ))}
                            </ol>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Channel Caption ({targetChannel})</p>
                            <p className="text-xs leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-xl border cl-divider italic">
                              "{previewCaption}"
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">Target Channel</p>
                              <p className="text-xs font-bold text-slate-950 uppercase">{targetChannel}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">Publish Flow</p>
                              <p className="text-xs font-bold text-slate-950 uppercase">{publishStrategy.replace(/_/g, " ")}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Call to Action</p>
                            <p className="text-sm font-medium text-slate-950">{previewCta}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Tracking Link</p>
                            <div className="flex items-center gap-2 text-xs">
                              <code className="truncate rounded bg-slate-100 px-2 py-1 text-blue-700">{trackingLink}</code>
                              <CopyButton text={trackingLink} />
                            </div>
                          </div>
                          <div className="pt-2">
                             <div className="flex items-center justify-between text-xs border-t pt-3 cl-divider">
                               <span className="text-slate-500 font-medium">Weekly Score:</span>
                               <span className="font-bold text-slate-950">{perf?.score ?? 0}</span>
                             </div>
                             <div className="flex items-center justify-between text-xs mt-2">
                               <span className="text-slate-500 font-medium">Performance:</span>
                               <span className={`font-bold uppercase tracking-wider ${perf?.classification === "winner" ? "text-emerald-600" : "text-slate-700"}`}>{perf?.classification ?? "Pending"}</span>
                             </div>
                          </div>
                        </div>
                      </div>

                      {!canDirectPublish ? (
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs leading-relaxed text-blue-800">
                          <p className="font-bold uppercase tracking-widest mb-1">Manual Export required</p>
                          This item is set for manual delivery. Render the post, download the bundle, and upload it manually to {targetChannel} using the preview caption and CTA provided.
                        </div>
                      ) : null}

                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target</p>
                          <TargetChannelControl contentItemId={post.id} value={targetChannel} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Delivery</p>
                          <PublishStrategyControl contentItemId={post.id} targetChannel={targetChannel} value={publishStrategy} />
                        </div>
                        <div className="space-y-1 flex flex-col justify-end">
                          <ActionButton endpoint={`/api/content-items/${post.id}/approve`} label="Approve" />
                        </div>
                        <ActionButton endpoint={`/api/content-items/${post.id}/regenerate`} label="Regenerate" />
                        <RenderButton endpoint={`/api/content-items/${post.id}/render`} label="Render Preview" initialTargetChannel={targetChannel} />
                        {canDirectPublish ? (
                          <ScheduleItemControl endpoint={`/api/content-items/${post.id}/schedule`} />
                        ) : (
                          <ExportBundleButton contentItemId={post.id} disabled={!assets.video} />
                        )}
                      </div>
                    </div>

                    <div className="w-full lg:w-80 bg-slate-50 border-l cl-divider p-6 md:p-8 flex flex-col items-center justify-center gap-6">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 self-start">Visual Preview</p>
                      {assets.video ? (
                        <div className="w-full max-w-[240px] space-y-4">
                          <video controls className="w-full rounded-2xl border-4 border-slate-900 bg-black shadow-2xl" src={assets.video.storageUrl} />
                          <a className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800" href={assets.video.storageUrl} download>
                            Download MP4
                          </a>
                        </div>
                      ) : assets.thumbnail ? (
                        <div className="w-full max-w-[240px] space-y-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={assets.thumbnail.storageUrl} alt="Post thumbnail" className="w-full rounded-2xl border cl-divider shadow-lg" />
                          <p className="text-center text-[10px] text-slate-500 italic leading-relaxed">Video is pending render. Thumbnail shows initial composition.</p>
                        </div>
                      ) : (
                        <div className="flex aspect-[9/16] w-full max-w-[200px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 text-center p-6">
                          <p className="text-xs text-slate-400">No render preview available yet. Run the render step to see the final clip.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="cl-card p-6">
            <h2 className="text-lg font-semibold text-slate-950">Conversion tracking</h2>
            <p className="mt-1 text-sm text-slate-600">Integrate this snippet into your product to track clicks and conversions back to your weekly cycles.</p>
            <div className="mt-5 relative group">
               <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-5 text-[11px] font-mono leading-relaxed text-slate-300">
                 {trackingSnippet}
               </pre>
               <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <CopyButton text={trackingSnippet} />
               </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              The script persists <code className="text-slate-700 font-bold">clp_click</code>. When a user converts, send that ID to the <code className="text-slate-700 font-bold">/api/track</code> endpoints to roll up performance data automatically.
            </p>
          </section>

          <section className="cl-card p-6">
            <h2 className="text-lg font-semibold text-slate-950">Operational job queue</h2>
            <p className="mt-1 text-sm text-slate-600">Current status of asynchronous publishing and background tasks for this week.</p>
            {jobs.length === 0 ? (
              <p className="mt-6 text-sm text-slate-400 italic">No background jobs have been queued for this cycle.</p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-left text-[13px]">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b cl-divider">
                      <th className="pb-3 pr-4">Job Type</th>
                      <th className="pb-3 pr-4">Scheduled For</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Retries</th>
                      <th className="pb-3 pr-4">Observations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y cl-divider">
                    {jobs.map((job) => (
                      <tr key={job.id} className="align-top">
                        <td className="py-3 pr-4 font-medium text-slate-900">{job.type}</td>
                        <td className="py-3 pr-4 text-slate-600">{new Date(job.runAt).toLocaleTimeString()}</td>
                        <td className="py-3 pr-4">
                           <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${job.status === "completed" ? "bg-emerald-50 text-emerald-700" : job.status === "failed" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                             {job.status}
                           </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-500">{job.attempts} / {job.maxAttempts}</td>
                        <td className="py-3 pr-4 text-xs text-red-700 max-w-xs truncate">{job.lastError ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
}
