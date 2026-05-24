import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { StudioShell } from "@/components/app/studio-shell";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getCurrentUsageSummary, getDisplayPlanName, getUserPlanState, type PlanType } from "@/domains/account/service";
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

function toPlanLabel(plan: string) {
  const normalized = plan.toLowerCase();
  if (normalized === "pro") return "Pro Plan";
  if (normalized === "beta") return "Beta Plan";
  return `${plan} Plan`;
}

export default async function StudioDashboardPage() {
  const user = await getCurrentUser();
  let planState: { effectivePlan: PlanType } = { effectivePlan: "beta" };
  let usage = {
    usage: { rendersPerMonth: 0, postsPerMonth: 0, publishesPerMonth: 0 },
    limits: { rendersPerMonth: 20, postsPerMonth: 100, publishesPerMonth: 20 },
  };
  let walletData = {
    wallet: { generationBalance: 120, renderBalance: 80 },
    transactions: [] as Array<{ id: string; reason: string; bucket: string; createdAt: Date; amountDelta: number }>,
  };
  let projects: Array<{ id: string; productName: string; projectType: string | null; updatedAt: Date }> = [];
  let recentItems: Array<{ id: string; internalTitle: string; updatedAt: Date }> = [];

  try {
    [planState, usage, walletData, projects] = await Promise.all([
      getUserPlanState(user.id),
      getCurrentUsageSummary(user.id),
      getCreditWalletWithRecentTransactions(user.id),
      listProjectsForUser(user.id),
    ]);

    const projectIds = projects.map((project) => project.id);
    recentItems =
      projectIds.length > 0
        ? await db.query.contentItems.findMany({
            where: inArray(schema.contentItems.projectId, projectIds),
            orderBy: [desc(schema.contentItems.updatedAt)],
            limit: 6,
          })
        : [];
  } catch (error) {
    console.error("Studio dashboard data fallback due to backend error:", error);
  }

  const totalCredits = walletData.wallet.generationBalance + walletData.wallet.renderBalance;
  const videosUsed = usage.usage.rendersPerMonth;
  const copiesUsed = usage.usage.postsPerMonth;
  const publishesUsed = usage.usage.publishesPerMonth;

  const quickActions = [
    { href: "/app/weekly-promo", title: "Create weekly promo video", detail: "Turn a product update into a short promo video.", cta: "Start promo" },
    { href: "/app/create", title: "Create Video", detail: "Guided workflow for short-form renders", cta: "Start create" },
    { href: "/app/chats", title: "Open Chats", detail: "Strategy and generation chat workspace", cta: "Open chats" },
    { href: "/app/projects", title: "Projects", detail: "Manage business and creator projects", cta: "View projects" },
    { href: "/dashboard/manual-queue", title: "Manual Queue", detail: "Review and deliver queued content", cta: "Open queue" },
  ];

  return (
    <StudioShell
      title={`Welcome, ${user.fullName?.split(" ")[0] ?? "Operator"}`}
      subtitle="Control planning, generation, rendering, and distribution in one workspace."
      userName={user.fullName}
      userEmail={user.email}
    >
      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} className="cl-card p-4 transition hover:border-blue-400">
                <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                <p className="mt-1 text-xs text-slate-600">{action.detail}</p>
                <p className="mt-3 text-xs font-semibold text-blue-600">{action.cta} →</p>
              </Link>
            ))}
          </div>

          <div className="cl-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
              <Link href="/dashboard/projects/new" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition hover:border-slate-400">
                New project
              </Link>
            </div>
            {projects.length === 0 ? (
              <p className="text-sm text-slate-600">No projects yet. Create one to unlock strategy, generation, and rendering flows.</p>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 6).map((project) => (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block rounded-lg border border-slate-200 bg-white p-3 transition hover:border-blue-300">
                    <p className="text-sm font-medium text-slate-900">{project.productName}</p>
                    <p className="text-xs text-slate-600">
                      {project.projectType ?? "Business"} • updated {timeAgo(project.updatedAt)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="cl-card p-5">
            <h2 className="text-lg font-semibold text-slate-900">Recent Outputs</h2>
            {recentItems.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No generated outputs yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {recentItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-sm font-medium text-slate-900">{item.internalTitle}</p>
                    <p className="text-xs text-slate-600">Updated {timeAgo(item.updatedAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="cl-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Plan</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{toPlanLabel(getDisplayPlanName(planState.effectivePlan))}</p>
            <Link href="/pricing" className="mt-4 inline-flex rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500">
              Manage plan
            </Link>
          </div>

          <div className="cl-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Credits</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{totalCredits}</p>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>Generation: {walletData.wallet.generationBalance}</p>
              <p>Render: {walletData.wallet.renderBalance}</p>
            </div>
          </div>

          <div className="cl-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Monthly Usage</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>Renders: {videosUsed} / {usage.limits.rendersPerMonth}</p>
              <p>Generations: {copiesUsed} / {usage.limits.postsPerMonth}</p>
              <p>Publishes: {publishesUsed} / {usage.limits.publishesPerMonth}</p>
            </div>
          </div>

          <div className="cl-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Recent Wallet Activity</p>
            {walletData.transactions.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No transactions yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {walletData.transactions.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-sm font-medium text-slate-900">{entry.reason.replaceAll("_", " ")}</p>
                    <p className="text-xs text-slate-600">
                      {entry.bucket} • {entry.amountDelta} • {timeAgo(entry.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </StudioShell>
  );
}
