import { canAccessProduct } from "@/domains/account/service";
import { listManualQueueItemsForUser } from "@/domains/content-items/service";
import { AccessGate } from "@/components/dashboard/access-gate";
import { getCurrentUser } from "@/lib/auth";
import { ExportBundleButton } from "@/components/dashboard/export-bundle-button";
import { RenderButton } from "@/components/dashboard/render-button";
import { ActionButton } from "@/components/dashboard/action-button";

type Search = {
  channel?: string;
  status?: string;
  sort?: string;
};

function normalizeChannel(value: string | undefined): "all" | "instagram" | "tiktok" | "whatsapp" {
  if (value === "instagram" || value === "tiktok" || value === "whatsapp") return value;
  return "all";
}

function normalizeStatus(value: string | undefined): "all" | "ready_for_export" | "exported" | "posted" {
  if (value === "ready_for_export" || value === "exported" || value === "posted") return value;
  return "all";
}

function normalizeSort(value: string | undefined): "newest" | "oldest" {
  if (value === "oldest") return "oldest";
  return "newest";
}

export default async function ManualQueuePage({ searchParams }: { searchParams: Promise<Search> }) {
  const query = await searchParams;
  const user = await getCurrentUser();
  const access = await canAccessProduct(user.id);
  if (!access) return <AccessGate email={user.email} />;

  const channel = normalizeChannel(query.channel);
  const status = normalizeStatus(query.status);
  const sort = normalizeSort(query.sort);

  const items = await listManualQueueItemsForUser(user.id, {
    targetChannel: channel,
    manualStatus: status,
    sort,
  });

  return (
    <div className="space-y-6">
      <section className="rounded border bg-white p-4">
        <h1 className="text-2xl font-bold">Manual Publish Queue</h1>
        <p className="mt-1 text-sm text-slate-600">
          Operational queue for manual-export items. Export bundles quickly and mark posted after platform upload.
        </p>
        <form className="mt-3 grid gap-3 md:grid-cols-4" method="GET">
          <select name="channel" defaultValue={channel} className="rounded border px-2 py-2 text-sm">
            <option value="all">All channels</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <select name="status" defaultValue={status} className="rounded border px-2 py-2 text-sm">
            <option value="all">All manual statuses</option>
            <option value="ready_for_export">ready_for_export</option>
            <option value="exported">exported</option>
            <option value="posted">posted</option>
          </select>
          <select name="sort" defaultValue={sort} className="rounded border px-2 py-2 text-sm">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <button className="rounded border bg-slate-50 px-3 py-2 text-sm">Apply filters</button>
        </form>
      </section>

      <section className="grid gap-4">
        {items.length === 0 ? (
          <div className="rounded border bg-white p-4 text-sm text-slate-600">No manual-export items for current filters.</div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.internalTitle}</p>
                  <p className="text-sm text-slate-600">{item.project?.productName ?? "Project"}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-slate-100 px-2 py-1">channel: {item.targetChannel}</span>
                  <span className="rounded bg-slate-100 px-2 py-1">strategy: {item.publishStrategy}</span>
                  <span className="rounded bg-slate-100 px-2 py-1">manual: {item.manualPublishStatus}</span>
                  <span className={`rounded px-2 py-1 ${item.isRendered ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {item.isRendered ? "rendered" : "needs render"}
                  </span>
                </div>
              </div>

              <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                <p>
                  <strong>Created:</strong> {item.createdAt.toISOString()}
                </p>
                <p>
                  <strong>Scheduled:</strong> {item.scheduledFor ? item.scheduledFor.toISOString() : "Not scheduled"}
                </p>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {!item.isRendered ? (
                  <RenderButton endpoint={`/api/content-items/${item.id}/render`} label="Render for export" initialTargetChannel={item.targetChannel} />
                ) : (
                  <ExportBundleButton contentItemId={item.id} />
                )}
                {item.manualPublishStatus !== "posted" ? (
                  <ActionButton endpoint={`/api/content-items/${item.id}/manual-posted`} label="Mark as posted" />
                ) : (
                  <div className="rounded border bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Posted confirmed</div>
                )}
                <a className="inline-flex items-center justify-center rounded border px-3 py-2 text-sm" href={`/dashboard/projects/${item.projectId}`}>
                  Open project
                </a>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
