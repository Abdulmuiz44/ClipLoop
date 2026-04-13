import { notFound } from "next/navigation";
import { ActionButton } from "@/components/dashboard/action-button";
import { RenderButton } from "@/components/dashboard/render-button";
import { ScheduleItemControl } from "@/components/dashboard/schedule-item-control";
import { BulkScheduleControl } from "@/components/dashboard/bulk-schedule-control";
import { RunJobsButton } from "@/components/dashboard/run-jobs-button";
import { CopyButton } from "@/components/dashboard/copy-button";
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
      <h1 className="text-2xl font-bold">Week of {cycle.weekStart.toISOString().slice(0, 10)}</h1>
      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Strategy summary</h2>
        <p className="mt-2">{cycle.strategySummary ?? "No summary"}</p>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Angles</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {angles.map((angle) => (
            <li key={angle.angle_id}>
              {angle.angle_name}: {angle.core_claim}
            </li>
          ))}
        </ul>
      </section>

      {posts.length === 0 ? (
        <ActionButton endpoint={`/api/strategy-cycles/${cycle.id}/generate-posts`} label="Generate 5 posts" />
      ) : (
        <>
          <section className="space-y-3 rounded border bg-white p-4">
            <h2 className="font-semibold">Weekly workflow controls</h2>
            <div className="grid gap-3 md:grid-cols-6">
              <ActionButton endpoint={`/api/strategy-cycles/${cycle.id}/approve`} label="Approve all posts" />
              <RenderButton endpoint={`/api/strategy-cycles/${cycle.id}/render`} label="Render all posts" compact />
              <ActionButton endpoint={`/api/strategy-cycles/${cycle.id}/rollup`} label="Roll up metrics" />
              <ActionButton endpoint={`/api/strategy-cycles/${cycle.id}/analyze`} label="Analyze this week" />
              <ActionButton endpoint={`/api/strategy-cycles/${cycle.id}/generate-next`} label="Generate next week" />
              <RunJobsButton />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">Bulk schedule</p>
              <BulkScheduleControl endpoint={`/api/strategy-cycles/${cycle.id}/schedule`} />
            </div>
          </section>



          <section className="rounded border bg-white p-4">
            <h2 className="font-semibold">Iteration analysis</h2>
            <p className="mt-2 text-sm">{summaryExperiment?.inputSummary ?? 'Run "Analyze this week" to generate insights.'}</p>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">Winner patterns</h3>
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {angleExperiments.length === 0 ? (
                    <li>No winner patterns yet.</li>
                  ) : (
                    angleExperiments.map((exp) => (
                      <li key={exp.id}>
                        {exp.hypothesis ?? ""}
                        {exp.winnerContentItemId ? ` (from ${exp.winnerContentItemId.slice(0, 8)}...)` : ""}
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold">Loser reasons</h3>
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {loserExperiments.length === 0 ? (
                    <li>No loser insights yet.</li>
                  ) : (
                    loserExperiments.map((exp) => (
                      <li key={exp.id}>{exp.inputSummary}</li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">Improved hooks</h3>
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {hookExperiments.length === 0 ? (
                    <li>No hook mutations yet.</li>
                  ) : (
                    hookExperiments.map((exp) => <li key={exp.id}>{exp.inputSummary}</li>)
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Angles to stop</h3>
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {anglesToStop.length === 0 ? (
                    <li>No stop-list yet.</li>
                  ) : (
                    anglesToStop.map((angle) => <li key={angle}>{angle}</li>)
                  )}
                </ul>
              </div>
            </div>

            {nextCycle ? (
              <div className="mt-4 rounded border bg-slate-50 p-3">
                <p className="text-sm font-medium">Next cycle generated:</p>
                <a className="text-sm" href={`/dashboard/projects/${project.id}/week/${nextCycle.id}`}>
                  View next week ({nextCycle.weekStart.toISOString().slice(0, 10)})
                </a>
                {nextCyclePosts.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {nextCyclePosts.map((post) => (
                      <li key={post.id}>
                        {post.internalTitle}
                        {post.parentContentItemId ? ` ← derived from ${post.parentContentItemId.slice(0, 8)}...` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="grid gap-4">
            {posts.map((post, index) => {
              const assets = assetsByPost[index];
              const perf = perfByContentId.get(post.id);
              const trackingLink = `/r/${post.trackingSlug}`;
              const latestJob = latestJobByContentId.get(post.id);
              const publishMode =
                latestJob?.payload.publishMode ??
                (post.externalPostUrl?.includes("/mock/") || post.externalPostId?.startsWith("mock-post-") ? "mock" : post.externalPostId ? "instagram" : "n/a");

              return (
                <article key={post.id} className="rounded border bg-white p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{post.internalTitle}</h3>
                    <div className="flex gap-2">
                      {renderBadge(post.renderStatus)}
                      {publishBadge(post.publishStatus)}
                      {post.approvedAt ? (
                        <span className="rounded bg-green-50 px-2 py-1 text-xs text-green-700">Approved</span>
                      ) : (
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">Not approved</span>
                      )}
                    </div>
                  </div>

                  <p className="mt-1 text-sm">
                    <strong>Hook:</strong> {post.hook}
                  </p>
                  <p className="mt-1 text-sm">
                    <strong>Slides:</strong>
                  </p>
                  <ol className="ml-5 list-decimal text-sm">
                    {((post.slidesJson as string[]) ?? []).map((slide) => (
                      <li key={slide}>{slide}</li>
                    ))}
                  </ol>
                  <p className="mt-1 text-sm">
                    <strong>Caption:</strong> {post.caption}
                  </p>
                  <p className="mt-1 text-sm">
                    <strong>Hashtags:</strong> {((post.hashtagsJson as string[]) ?? []).join(" ")}
                  </p>
                  <p className="mt-1 text-sm">
                    <strong>CTA:</strong> {post.ctaText}
                  </p>
                  <p className="mt-1 text-sm">
                    <strong>Tracking link:</strong> <a href={trackingLink}>{trackingLink}</a>
                    <span className="ml-2 inline-block"><CopyButton text={trackingLink} /></span>
                  </p>
                  <p className="mt-1 text-sm">
                    <strong>Clicks / Signups / Revenue:</strong> {perf?.clicks ?? 0} / {perf?.signups ?? 0} / {perf?.revenue ?? 0}
                  </p>
                  <p className="mt-1 text-sm">
                    <strong>Score:</strong> {perf?.score ?? 0} | <strong>Classification:</strong> {perf?.classification ?? "-"}
                  </p>
                  <p className="mt-1 text-sm">
                    <strong>Scheduled:</strong> {post.scheduledFor ? post.scheduledFor.toISOString() : "Not scheduled"}
                  </p>
                  <p className="mt-1 text-sm">
                    <strong>Published:</strong> {post.publishedAt ? post.publishedAt.toISOString() : "Not published"}
                  </p>
                  <p className="mt-1 text-sm">
                    <strong>External:</strong> {post.externalPostUrl ? (
                      <a href={post.externalPostUrl} target="_blank" rel="noreferrer">
                        {post.externalPostId ?? post.externalPostUrl}
                      </a>
                    ) : "N/A"}
                  </p>
                  <p className="mt-1 text-sm">
                    <strong>Publish mode:</strong> {publishMode}
                  </p>
                  <p className="mt-1 text-sm">
                    <strong>Publish error:</strong> {latestJob?.job.lastError ?? "None"}
                  </p>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <ActionButton endpoint={`/api/content-items/${post.id}/regenerate`} label="Regenerate this post" />
                    <RenderButton endpoint={`/api/content-items/${post.id}/render`} label="Render this post" />
                    <ActionButton endpoint={`/api/content-items/${post.id}/approve`} label="Approve this post" />
                    <ScheduleItemControl endpoint={`/api/content-items/${post.id}/schedule`} />
                  </div>

                  {assets.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={assets.thumbnail.storageUrl} alt="Post thumbnail" className="mt-4 max-w-48 rounded border" />
                  ) : null}

                  {assets.video ? (
                    <div className="mt-4 space-y-2">
                      <video controls className="max-h-[500px] rounded border" src={assets.video.storageUrl} />
                      <a className="inline-block rounded border px-3 py-2 text-sm" href={assets.video.storageUrl} download>
                        Download MP4
                      </a>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>

          <section className="rounded border bg-white p-4">
            <h2 className="font-semibold">Tracking helper</h2>
            <p className="mt-1 text-sm">Add this script on your site to persist `clp_click` into localStorage/cookie.</p>
            <pre className="mt-2 overflow-x-auto rounded bg-slate-100 p-2 text-xs">{trackingSnippet}</pre>
            <p className="mt-2 text-xs text-slate-600">
              After signup/purchase, send `clickId` to `/api/track/conversion` or `/api/track/revenue`.
            </p>
          </section>

          <section className="rounded border bg-white p-4">
            <h2 className="font-semibold">Job queue</h2>
            {jobs.length === 0 ? (
              <p className="text-sm text-slate-600">No jobs queued yet.</p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="pr-4">Type</th>
                      <th className="pr-4">Run at</th>
                      <th className="pr-4">Status</th>
                      <th className="pr-4">Attempts</th>
                      <th className="pr-4">Last error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-t align-top">
                        <td className="pr-4">{job.type}</td>
                        <td className="pr-4">{job.runAt.toISOString()}</td>
                        <td className="pr-4">{job.status}</td>
                        <td className="pr-4">{job.attempts}/{job.maxAttempts}</td>
                        <td className="pr-4 text-red-700">{job.lastError ?? "-"}</td>
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
