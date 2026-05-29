import Link from "next/link";
import { StudioShell } from "@/components/app/studio-shell";
import { DashboardUsageSection, DashboardBalanceDisplay } from "@/components/app/dashboard-usage-section";
import { getCurrentUser } from "@/lib/auth";

function ActionIcon({ bg, children }: { bg: string; children: React.ReactNode }) {
  return <div className={`mb-3 grid h-10 w-10 place-items-center rounded-2xl ${bg}`}>{children}</div>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-600">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-slate-100 text-slate-700">•</span>
      <span className="font-medium text-slate-900">{value}</span>
      <span className="text-slate-500">{label}</span>
    </div>
  );
}

const quickActions = [
  {
    title: "Generate Video",
    detail: "Turn your idea into a scroll-stopping video.",
    iconBg: "bg-emerald-500/10",
    iconFg: "text-emerald-600",
  },
  {
    title: "Generate Copy",
    detail: "Create hooks, captions and ad copy.",
    iconBg: "bg-violet-500/10",
    iconFg: "text-violet-600",
  },
  {
    title: "New Project",
    detail: "Create a new project for your brand.",
    iconBg: "bg-sky-500/10",
    iconFg: "text-sky-600",
  },
  {
    title: "Import Website",
    detail: "Import your website to learn about your brand.",
    iconBg: "bg-amber-500/10",
    iconFg: "text-amber-600",
  },
];

const demoProjects = [
  { name: "GlowSkin Launch", type: "Beauty Brand", updated: "Updated 2h ago", videos: 12, copies: 36, weeks: 2 },
  { name: "TaskFlow App", type: "SaaS", updated: "Updated 1d ago", videos: 18, copies: 42, weeks: 3 },
  { name: "UrbanStep Sneakers", type: "E-commerce", updated: "Updated 2d ago", videos: 10, copies: 28, weeks: 2 },
  { name: "Nutripower Shake", type: "Health & Wellness", updated: "Updated 3d ago", videos: 8, copies: 24, weeks: 1 },
];

const recentOutputs = [
  { name: "GlowSkin Promo", meta: "15s • 1080x1920", kind: "Video", when: "2h ago" },
  { name: "Nutripower Ad", meta: "30s • 1080x1080", kind: "Video", when: "5h ago" },
  { name: "TaskFlow Hook", meta: "Caption + Copy", kind: "Copy", when: "1d ago" },
  { name: "Summer Drop Teaser", meta: "15s • 1080x1920", kind: "Video", when: "2d ago" },
];

export const dynamic = "force-dynamic";

export default async function StudioDashboardPage() {
  const user = await getCurrentUser();
  const firstName = user.fullName?.split(" ")[0] ?? "John";

  return (
    <StudioShell title={`Welcome back, ${firstName}!`} subtitle="Create, package, and post scroll-stopping content faster." userName={user.fullName} userEmail={user.email}>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Welcome back, {firstName}! 👋</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Create, package, and post scroll-stopping content faster.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((item) => (
              <Link key={item.title} href="/app/create" className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900">
                <ActionIcon bg={item.iconBg}>
                  <span className={item.iconFg}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 2l1.2 5.1L18 9l-4.8 1.9L12 16l-1.2-5.1L6 9l4.8-1.9L12 2Z" stroke="currentColor" strokeWidth="1.7" />
                    </svg>
                  </span>
                </ActionIcon>
                <p className="text-base font-semibold text-slate-900 dark:text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.detail}</p>
                <p className="mt-3 text-sm text-slate-400 transition group-hover:translate-x-0.5">
                  →
                </p>
              </Link>
            ))}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Your Projects</h2>
              <Link href="/app/projects" className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
                View all projects →
              </Link>
            </div>

            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {demoProjects.map((project) => (
                  <Link
                    key={project.name}
                    href="/app/projects"
                    className="min-w-[260px] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="relative h-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
                      <div className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white">
                        ▶
                      </div>
                      <div className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white">
                        ⋯
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{project.name}</p>
                      <p className="text-xs text-slate-500">{project.type}</p>
                      <p className="mt-2 text-xs text-slate-500">{project.updated}</p>
                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                        <Stat label="Videos" value={project.videos} />
                        <Stat label="Copies" value={project.copies} />
                        <Stat label="Weeks" value={project.weeks} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <button
                aria-label="Next"
                className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm md:grid dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                →
              </button>
            </div>
          </div>

          {/* Usage & API section — real data from backend */}
          <DashboardUsageSection />
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Credits Balance</p>
                <p className="mt-2 text-4xl font-semibold text-slate-900 dark:text-white">
                  <DashboardBalanceDisplay /> <span className="text-base font-normal text-slate-500">credits</span>
                </p>
              </div>
              <button className="mt-1 h-10 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-slate-900">Buy Credits</button>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-1.5 w-4/5 rounded-full bg-emerald-500" />
            </div>
            <p className="mt-2 text-xs text-slate-500">You have enough credits to generate 8 more videos.</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-white">CL</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Pro Plan</p>
                  <p className="text-xs text-slate-500">Active</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Active</span>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Recent Outputs</p>
              <Link href="/app/projects" className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">View all →</Link>
            </div>
            <ul className="mt-4 space-y-3">
              {recentOutputs.map((item) => (
                <li key={item.name} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.meta}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${item.kind === "Video" ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700"} dark:bg-slate-700 dark:text-slate-200`}>
                    {item.kind}
                  </span>
                  <span className="text-xs text-slate-400">{item.when}</span>
                  <button aria-label="More" className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">⋮</button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Tips to get better results</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">🔎</span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Be specific with your idea</p>
                  <p className="text-xs text-slate-500">Add details about your audience, offer and goal.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">📣</span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Choose the right channel</p>
                  <p className="text-xs text-slate-500">Different platforms need different styles.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  🏷️
                </span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Use your brand context</p>
                  <p className="text-xs text-slate-500">Import your site or add more brand info.</p>
                </div>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </StudioShell>
  );
}
