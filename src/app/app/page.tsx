import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { StudioShell } from "@/components/app/studio-shell";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getCurrentUsageSummary, getDisplayPlanName, getUserPlanState } from "@/domains/account/service";
import { getCreditWalletWithRecentTransactions } from "@/domains/credits/service";
import { listProjectsForUser } from "@/domains/projects/service";

export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  if (diffHours < 24) return `${diffHours}h ago`;
  const days = Math.floor(diffHours / 24);
  return `${days}d ago`;
}

export default async function StudioDashboardPage() {
  const user = await getCurrentUser();
  const [planState, usage, walletData, projects] = await Promise.all([
    getUserPlanState(user.id),
    getCurrentUsageSummary(user.id),
    getCreditWalletWithRecentTransactions(user.id),
    listProjectsForUser(user.id),
  ]);

  const projectIds = projects.map((project) => project.id);
  const recentItems =
    projectIds.length > 0
      ? await db.query.contentItems.findMany({ where: inArray(schema.contentItems.projectId, projectIds), orderBy: [desc(schema.contentItems.updatedAt)], limit: 6 })
      : [];

  const itemIds = recentItems.map((item) => item.id);
  const assets =
    itemIds.length > 0
      ? await db.query.contentAssets.findMany({ where: inArray(schema.contentAssets.contentItemId, itemIds), orderBy: [desc(schema.contentAssets.createdAt)] })
      : [];

  const projectById = new Map(projects.map((project) => [project.id, project]));
  const thumbByItemId = new Map(
    assets.filter((asset) => asset.assetType === "thumbnail").map((asset) => [asset.contentItemId, asset.storageUrl]),
  );

  const totalCredits = walletData.wallet.generationBalance + walletData.wallet.renderBalance;
  const lowCredits = totalCredits <= 3;

  return (
    <StudioShell
      title={`Welcome back, ${user.fullName?.split(" ")[0] ?? "there"}`}
      subtitle="Create, package, and post scroll-stopping content faster with your ClipLoop studio."
    >
      <div className="grid gap-5 xl:grid-cols-[1.6fr_0.95fr]">
        <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard title="Generate Video" description="Go through guided brief + render flow." href="/app/create" />
            <ActionCard title="Generate Copy" description="Use chats for quick copy generation." href="/app/chats" />
            <ActionCard title="New Project" description="Create a fresh brand workspace." href="/dashboard/projects/new" />
            <ActionCard title="Import Website" description="Refresh business context from your site." href="/dashboard/projects/new" />
          </section>

          <section className="cl-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Your Projects</h2>
              <Link href="/app/projects" className="text-sm text-slate-600">View all →</Link>
            </div>
            {projects.length === 0 ? (
              <EmptyState title="No projects yet" message="Create your first project workspace to unlock guided creation and rendering." ctaHref="/dashboard/projects/new" ctaLabel="Create project" />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {projects.slice(0, 3).map((project) => (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="rounded-2xl border bg-white p-4 transition hover:border-slate-400 cl-divider">
                    <p className="font-semibold text-slate-950">{project.productName}</p>
                    <p className="mt-1 text-xs text-slate-500">{project.projectType ?? "business"}</p>
                    <p className="mt-3 text-xs text-slate-600 line-clamp-2">{project.oneLiner ?? project.description}</p>
                    <p className="mt-4 text-xs text-slate-500">Updated {timeAgo(project.updatedAt)}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="cl-card p-5">
              <h2 className="text-lg font-semibold text-slate-950">Recent Activity</h2>
              <div className="mt-4 space-y-3">
                {walletData.transactions.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-xl border bg-slate-50 p-3 text-sm cl-divider">
                    <div>
                      <p className="font-medium text-slate-900">{entry.reason.replaceAll("_", " ")}</p>
                      <p className="text-xs text-slate-500">{timeAgo(entry.createdAt)}</p>
                    </div>
                    <p className={`text-xs font-semibold ${entry.amountDelta < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {entry.amountDelta > 0 ? `+${entry.amountDelta}` : entry.amountDelta} {entry.bucket}
                    </p>
                  </div>
                ))}
                {walletData.transactions.length === 0 ? <p className="text-sm text-slate-500">No account activity yet.</p> : null}
              </div>
            </div>

            <div className="cl-card p-5">
              <h2 className="text-lg font-semibold text-slate-950">Usage Overview</h2>
              <p className="mt-1 text-sm text-slate-600">Current month usage against plan limits.</p>
              <div className="mt-4 space-y-3 text-sm">
                <UsageRow label="Posts" used={usage.usage.postsPerMonth} limit={usage.limits.postsPerMonth} />
                <UsageRow label="Renders" used={usage.usage.rendersPerMonth} limit={usage.limits.rendersPerMonth} />
                <UsageRow label="Published" used={usage.usage.publishesPerMonth} limit={usage.limits.publishesPerMonth} />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="cl-card p-5">
            <p className="text-sm font-medium text-slate-700">Credits Balance</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">{totalCredits}</p>
            <p className="mt-1 text-sm text-slate-600">{walletData.wallet.generationBalance} generation · {walletData.wallet.renderBalance} render</p>
            <div className="mt-4 h-2 rounded-full bg-slate-200">
              <div className={`h-2 rounded-full ${lowCredits ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (totalCredits / 40) * 100)}%` }} />
            </div>
            <p className="mt-3 text-xs text-slate-600">{lowCredits ? "Low credits: top up to continue generating videos." : "You have enough credits for several generations."}</p>
            <Link href="/pricing" className="mt-4 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">Buy Credits / Upgrade</Link>
          </section>

          <section className="cl-card p-5">
            <p className="text-sm font-medium text-slate-700">Plan</p>
            <p className="mt-2 text-xl font-semibold uppercase text-slate-950">{getDisplayPlanName(planState.effectivePlan)}</p>
            <p className="mt-1 text-sm text-slate-500">Status: {planState.billingStatus}</p>
          </section>

          <section className="cl-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-950">Recent Outputs</h2>
            </div>
            <div className="space-y-3">
              {recentItems.slice(0, 4).map((item) => (
                <Link key={item.id} href={`/dashboard/projects/${item.projectId}`} className="flex items-center gap-3 rounded-xl border p-2.5 transition hover:border-slate-400 cl-divider">
                  {thumbByItemId.get(item.id) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbByItemId.get(item.id)!} alt="Output thumbnail" className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">No preview</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{item.internalTitle}</p>
                    <p className="text-xs text-slate-500">{projectById.get(item.projectId)?.productName ?? "Project"} · {item.targetChannel}</p>
                  </div>
                  <p className="text-xs text-slate-500">{timeAgo(item.updatedAt)}</p>
                </Link>
              ))}
              {recentItems.length === 0 ? <p className="text-sm text-slate-500">No outputs yet. Start from Generate Video.</p> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="font-semibold text-blue-950">Tips to get better results</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-900">
              <li>Be specific with audience, offer, and channel.</li>
              <li>Use guided Create for the fastest prompt-to-video path.</li>
              <li>Import your website to improve brand context quality.</li>
            </ul>
          </section>
        </div>
      </div>
    </StudioShell>
  );
}

function ActionCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border bg-white p-4 transition hover:border-slate-400 cl-divider">
      <p className="text-base font-semibold text-slate-950">{title}</p>
      <p className="mt-1.5 text-sm text-slate-600">{description}</p>
      <p className="mt-4 text-sm font-medium text-slate-700">Open →</p>
    </Link>
  );
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span>
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-slate-800" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ title, message, ctaHref, ctaLabel }: { title: string; message: string; ctaHref: string; ctaLabel: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-6 text-center cl-divider">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
      <Link href={ctaHref} className="mt-4 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">{ctaLabel}</Link>
    </div>
  );
}
