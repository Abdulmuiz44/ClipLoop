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
      <section className="cl-card p-5 md:p-6">
        <p className="cl-kicker">Packaging & Delivery</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Manual Publish Queue</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Manage items set for manual export. Download bundles for TikTok, WhatsApp, or other platforms, then mark as posted once live.
        </p>
        <form className="mt-5 grid gap-3 md:grid-cols-4" method="GET">
          <select name="channel" defaultValue={channel} className="cl-select">
            <option value="all">All channels</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <select name="status" defaultValue={status} className="cl-select">
            <option value="all">All statuses</option>
            <option value="ready_for_export">Ready to export</option>
            <option value="exported">Exported</option>
            <option value="posted">Posted</option>
          </select>
          <select name="sort" defaultValue={sort} className="cl-select">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <button className="rounded-xl border bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
            Apply filters
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        {items.length === 0 ? (
          <div className="cl-card p-8 text-center text-sm text-slate-600">
            <p className="cl-kicker">Queue empty</p>
            <p className="mt-2">No manual-export items match your current filters.</p>
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="cl-card p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="cl-kicker uppercase">{item.project?.productName ?? "Project"}</p>
                  <h3 className="mt-1 font-semibold text-slate-950">{item.internalTitle}</h3>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-wider">
                  <span className="cl-badge bg-slate-100 text-slate-600">{item.targetChannel}</span>
                  <span className="cl-badge bg-blue-50 text-blue-700">{item.manualPublishStatus.replace(/_/g, " ")}</span>
                  <span className={`rounded-full px-2 py-1 ${item.isRendered ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {item.isRendered ? "Rendered" : "Needs render"}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 border-t pt-4 text-xs text-slate-500 cl-divider md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">Created:</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">Scheduled:</span>
                  <span>{item.scheduledFor ? new Date(item.scheduledFor).toLocaleDateString() : "Not scheduled"}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {!item.isRendered ? (
                  <RenderButton endpoint={`/api/content-items/${item.id}/render`} label="Render for export" initialTargetChannel={item.targetChannel} />
                ) : (
                  <ExportBundleButton contentItemId={item.id} />
                )}
                {item.manualPublishStatus !== "posted" ? (
                  <ActionButton endpoint={`/api/content-items/${item.id}/manual-posted`} label="Mark as posted" />
                ) : (
                  <div className="flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    Posted confirmed
                  </div>
                )}
                <a className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium text-slate-700 transition cl-divider hover:bg-slate-50" href={`/dashboard/projects/${item.projectId}`}>
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
