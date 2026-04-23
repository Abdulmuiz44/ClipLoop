import Image from "next/image";
import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { StudioShell } from "@/components/app/studio-shell";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getCurrentUsageSummary, getDisplayPlanName, getUserPlanState } from "@/domains/account/service";
import { getCreditWalletWithRecentTransactions } from "@/domains/credits/service";
import { listProjectsForUser } from "@/domains/projects/service";
import cliploopLogo from "../../../assets/cliploop_logo.png";

export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  if (diffHours < 24) return `${diffHours}h ago`;
  const days = Math.floor(diffHours / 24);
  return `${days}d ago`;
}

const fallbackProjects = [
  { id: "demo-1", name: "GlowSkin Launch", type: "Beauty Brand", updatedAt: "Updated 2h ago", stats: [12, 36, 2], image: "linear-gradient(135deg,#10131a,#4b5563)" },
  { id: "demo-2", name: "TaskFlow App", type: "SaaS", updatedAt: "Updated 1d ago", stats: [18, 42, 3], image: "linear-gradient(135deg,#253a67,#101827)" },
  { id: "demo-3", name: "UrbanStep Sneakers", type: "E-commerce", updatedAt: "Updated 2d ago", stats: [10, 28, 2], image: "linear-gradient(135deg,#3b3b3b,#0f172a)" },
  { id: "demo-4", name: "Nutripower Shake", type: "Health & Wellness", updatedAt: "Updated 3d ago", stats: [8, 24, 1], image: "linear-gradient(135deg,#f8c2d8,#fbcfe8)" },
];

const actionCards = [
  { title: "Generate Video", description: "Turn your idea into a scroll-stopping video.", href: "/app/create", icon: "G", iconColor: "bg-[#37be64]" },
  { title: "Generate Copy", description: "Create hooks, captions and ad copy.", href: "/app/chats", icon: "C", iconColor: "bg-[#8b5dd7]" },
  { title: "New Project", description: "Create a new project for your brand.", href: "/dashboard/projects/new", icon: "N", iconColor: "bg-[#4f8fe8]" },
  { title: "Import Website", description: "Import your website to learn your brand.", href: "/dashboard/projects/new", icon: "I", iconColor: "bg-[#e7b735]" },
];

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

  const thumbByItemId = new Map(
    assets.filter((asset) => asset.assetType === "thumbnail").map((asset) => [asset.contentItemId, asset.storageUrl]),
  );

  const totalCredits = walletData.wallet.generationBalance + walletData.wallet.renderBalance;
  const creditProgress = Math.min(100, (totalCredits / 200) * 100);

  const videosUsed = usage.usage.rendersPerMonth;
  const copiesUsed = usage.usage.postsPerMonth;
  const othersUsed = usage.usage.publishesPerMonth;
  const usageTotal = videosUsed + copiesUsed + othersUsed;
  const usageCap = Math.max(1, usage.limits.rendersPerMonth + usage.limits.postsPerMonth + usage.limits.publishesPerMonth);
  const usageProgress = Math.min(100, Math.round((usageTotal / usageCap) * 100));

  const projectsView =
    projects.length > 0
      ? projects.slice(0, 4).map((project, index) => ({
          id: project.id,
          name: project.productName,
          type: project.projectType ?? "Business",
          updatedAt: `Updated ${timeAgo(project.updatedAt)}`,
          stats: [Math.max(1, usage.usage.postsPerMonth - index), Math.max(1, usage.usage.rendersPerMonth + index), Math.max(1, usage.usage.publishesPerMonth)],
          image: fallbackProjects[index % fallbackProjects.length]!.image,
        }))
      : fallbackProjects;

  const recentOutputRows =
    recentItems.length > 0
      ? recentItems.slice(0, 4).map((item, index) => ({
          id: item.id,
          title: item.internalTitle,
          subtitle: index % 2 === 0 ? "Video" : "Copy",
          resolution: index % 2 === 0 ? "15s - 1080x1920" : "Caption - Copy",
          age: timeAgo(item.updatedAt),
          thumb: thumbByItemId.get(item.id) ?? null,
        }))
      : [
          { id: "out-1", title: "GlowSkin Promo", subtitle: "Video", resolution: "15s - 1080x1920", age: "2h ago", thumb: null },
          { id: "out-2", title: "Nutripower Ad", subtitle: "Video", resolution: "30s - 1080x1080", age: "5h ago", thumb: null },
          { id: "out-3", title: "TaskFlow Hook", subtitle: "Copy", resolution: "Caption - Copy", age: "1d ago", thumb: null },
          { id: "out-4", title: "Summer Drop Teaser", subtitle: "Video", resolution: "15s - 1080x1920", age: "2d ago", thumb: null },
        ];

  const recentActivityRows =
    walletData.transactions.length > 0
      ? walletData.transactions.slice(0, 4).map((entry) => ({
          id: entry.id,
          label: entry.reason.replaceAll("_", " "),
          detail: `${entry.bucket} transaction`,
          age: timeAgo(entry.createdAt),
          delta: entry.amountDelta,
        }))
      : [
          { id: "act-1", label: "Video generated", detail: "GlowSkin Launch - 15s Promo", age: "2h ago", delta: -10 },
          { id: "act-2", label: "Copy generated", detail: "TaskFlow App - Ad Copy Pack", age: "4h ago", delta: -2 },
          { id: "act-3", label: "Website imported", detail: "urbanstep.com", age: "1d ago", delta: 0 },
          { id: "act-4", label: "Project created", detail: "Nutripower Shake", age: "2d ago", delta: 0 },
        ];

  return (
    <StudioShell title="Welcome back, ClipLoop Studio" subtitle="Create, package, and post scroll-stopping content faster.">
      <div className="grid gap-5 xl:grid-cols-[1.75fr_0.95fr]">
        <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {actionCards.map((action) => (
              <Link key={action.title} href={action.href} className="rounded-2xl border border-[#e3e6eb] bg-white p-5 transition hover:border-[#cfd4dc]">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg text-white ${action.iconColor}`}>{action.icon}</span>
                <p className="mt-4 text-[30px] font-semibold leading-tight text-[#1b222f]">{action.title}</p>
                <p className="mt-2 text-[20px] leading-tight text-[#7b8491]">{action.description}</p>
                <p className="mt-4 text-xl text-[#2a3140]">-></p>
              </Link>
            ))}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[38px] font-semibold leading-tight text-[#1a212e]">Your Projects</h2>
              <Link href="/app/projects" className="text-[18px] text-[#626b7a]">View all projects -></Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {projectsView.map((project) => (
                <Link key={project.id} href={project.id.startsWith("demo") ? "/app/projects" : `/dashboard/projects/${project.id}`} className="overflow-hidden rounded-2xl border border-[#e0e3e9] bg-white">
                  <div className="relative h-32" style={{ background: project.image }}>
                    <span className="absolute right-2 top-2 rounded-full bg-black/40 px-1.5 py-0.5 text-xs text-white">...</span>
                  </div>
                  <div className="p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="relative h-5 w-5 overflow-hidden rounded-full border border-[#d6d9e0] bg-white">
                        <Image src={cliploopLogo} alt="ClipLoop mark" fill sizes="20px" className="object-cover" />
                      </span>
                      <p className="truncate text-[22px] font-semibold leading-none text-[#1a212e]">{project.name}</p>
                    </div>
                    <p className="mt-1 text-[16px] text-[#727c8c]">{project.type}</p>
                    <p className="mt-1 text-[14px] text-[#8f98a7]">{project.updatedAt}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[13px] text-[#697282]">
                      <p>{project.stats[0]} Videos</p>
                      <p>{project.stats[1]} Copies</p>
                      <p>{project.stats[2]} Weeks</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#e0e3e9] bg-white p-5">
              <h2 className="text-[34px] font-semibold leading-tight text-[#1a212e]">Recent Activity</h2>
              <div className="mt-4 space-y-3">
                {recentActivityRows.map((entry, index) => (
                  <div key={entry.id} className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg text-sm text-white ${
                          index % 3 === 0 ? "bg-[#34b866]" : index % 3 === 1 ? "bg-[#8b5dd7]" : "bg-[#e7b735]"
                        }`}
                      >
                        {index % 3 === 0 ? "V" : index % 3 === 1 ? "C" : "I"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[17px] font-semibold text-[#1d2431]">{capitalizeWords(entry.label)}</p>
                        <p className="truncate text-[14px] text-[#7d8796]">{entry.detail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] text-[#7d8796]">{entry.age}</p>
                      <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[12px] ${entry.delta < 0 ? "bg-[#e9f9ef] text-[#28a35c]" : "bg-[#e9f9ef] text-[#28a35c]"}`}>
                        {entry.delta < 0 ? `${entry.delta} credits` : "Free"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e0e3e9] bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[34px] font-semibold leading-tight text-[#1a212e]">Usage Overview</h2>
                <span className="rounded-lg bg-[#f2f4f8] px-2 py-1 text-xs text-[#798191]">This Month v</span>
              </div>
              <div className="mt-4 grid grid-cols-[1.1fr_1fr] items-center gap-3">
                <div className="mx-auto h-40 w-40 rounded-full" style={{ background: `conic-gradient(#33b864 0 ${Math.max(12, Math.round((videosUsed / Math.max(1, usageCap)) * 360))}deg, #8b5dd7 ${Math.max(12, Math.round((videosUsed / Math.max(1, usageCap)) * 360))}deg ${Math.max(22, Math.round(((videosUsed + copiesUsed) / Math.max(1, usageCap)) * 360))}deg, #e7b735 ${Math.max(22, Math.round(((videosUsed + copiesUsed) / Math.max(1, usageCap)) * 360))}deg 360deg)` }}>
                  <div className="m-[16px] flex h-[128px] w-[128px] flex-col items-center justify-center rounded-full bg-white text-center">
                    <p className="text-[52px] font-semibold leading-none text-[#1a212e]">{usageTotal}</p>
                    <p className="mt-1 text-[14px] text-[#7a8391]">Credits</p>
                    <p className="text-[14px] text-[#7a8391]">Used</p>
                  </div>
                </div>
                <div className="space-y-3 text-[15px] text-[#606a7a]">
                  <p className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#33b864]" />Videos</span><span>{videosUsed} credits</span></p>
                  <p className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#8b5dd7]" />Copies</span><span>{copiesUsed} credits</span></p>
                  <p className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#e7b735]" />Others</span><span>{othersUsed} credits</span></p>
                </div>
              </div>
              <div className="mt-4 border-t border-[#eceef2] pt-3">
                <p className="flex items-center justify-between text-[15px] text-[#727b89]">
                  <span>Total Credits Used</span>
                  <span>{usageTotal} / {usageCap}</span>
                </p>
                <div className="mt-2 h-2 rounded-full bg-[#e9edf2]">
                  <div className="h-2 rounded-full bg-[#34b866]" style={{ width: `${usageProgress}%` }} />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-[#e0e3e9] bg-white p-5">
            <p className="text-[16px] font-medium text-[#50596a]">Credits Balance</p>
            <p className="mt-2 text-[56px] font-semibold leading-none text-[#1a212e]">{totalCredits} <span className="text-[18px] font-medium text-[#7b8491]">credits</span></p>
            <div className="mt-4 h-2 rounded-full bg-[#e8edf2]">
              <div className="h-2 rounded-full bg-[#34b866]" style={{ width: `${creditProgress}%` }} />
            </div>
            <p className="mt-2 text-[14px] text-[#7b8491]">You have enough credits to generate {Math.max(1, Math.floor(totalCredits / 16))} more videos.</p>
            <Link href="/pricing" className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#101721] px-4 text-sm font-semibold text-white">Buy Credits</Link>
          </section>

          <section className="rounded-2xl border border-[#e0e3e9] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative h-10 w-10 overflow-hidden rounded-full border border-[#d9dee5] bg-white">
                  <Image src={cliploopLogo} alt="ClipLoop plan" fill sizes="40px" className="object-cover" />
                </span>
                <div>
                  <p className="text-[20px] font-semibold text-[#1a212e]">{toPlanLabel(getDisplayPlanName(planState.effectivePlan))}</p>
                  <p className="text-[13px] text-[#7b8491]">Renews on May 12, 2025</p>
                </div>
              </div>
              <span className="rounded-full bg-[#e8faef] px-2 py-0.5 text-xs font-medium text-[#2aa95f]">Active</span>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e0e3e9] bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[30px] font-semibold leading-tight text-[#1a212e]">Recent Outputs</h2>
              <Link href="/app/projects" className="text-[14px] text-[#6f7888]">View all -></Link>
            </div>
            <div className="space-y-2.5">
              {recentOutputRows.map((row, index) => (
                <Link key={row.id} href="/app/projects" className="flex items-center gap-3 rounded-xl border border-[#e7eaf0] p-2.5 hover:bg-[#fafbfd]">
                  {row.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.thumb} alt={row.title} className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg" style={{ background: fallbackProjects[index % fallbackProjects.length]!.image }} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold text-[#1f2633]">{row.title}</p>
                    <p className="text-[13px] text-[#7b8491]">{row.resolution}</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${row.subtitle === "Video" ? "bg-[#e8faef] text-[#2aa95f]" : "bg-[#f0ecff] text-[#7f57ce]"}`}>{row.subtitle}</span>
                    <p className="mt-1 text-[12px] text-[#7b8491]">{row.age}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#e0e3e9] bg-white p-5">
            <h3 className="text-[26px] font-semibold leading-tight text-[#1a212e]">Tips to get better results</h3>
            <div className="mt-3 space-y-3 text-[14px] text-[#6e7786]">
              <p><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#f2f4f8] text-xs">Q</span>Be specific with your idea</p>
              <p><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#f2f4f8] text-xs">*</span>Choose the right channel</p>
              <p><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#f2f4f8] text-xs">O</span>Use your brand context</p>
            </div>
          </section>
        </div>
      </div>
    </StudioShell>
  );
}

function capitalizeWords(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function toPlanLabel(plan: string) {
  if (plan.toLowerCase() === "pro") return "Pro Plan";
  if (plan.toLowerCase() === "beta") return "Beta Plan";
  return `${capitalizeWords(plan)} Plan`;
}
