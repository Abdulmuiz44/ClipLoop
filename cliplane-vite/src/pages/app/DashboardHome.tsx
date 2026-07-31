import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.DEV ? "/api" : "https://api.talocode.site/v1/cliplane";

type SessionUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

type UsageData = {
  dashboard: {
    credits: { generationBalance: number; renderBalance: number; totalBalance: number; periodKey: string };
    usageEvents: Array<{
      id: string;
      action: string;
      source: "web" | "public_api";
      creditsBucket: string | null;
      creditsAmount: number | null;
      createdAt: string;
      keyPrefix: string | null;
    }>;
    breakdownByAction: Record<string, number>;
    publicApiUsageCount: number;
    creditsSpentLast7d: number;
    creditsSpentLast30d: number;
    apiKeys: Array<{
      id: string;
      label: string;
      keyPrefix: string;
      status: "active" | "revoked";
      scopes: string[];
      createdAt: string;
      lastUsedAt: string | null;
    }>;
  };
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function actionLabel(action: string) {
  if (action === "api_weekly_promo_generate") return "Weekly Promo (API)";
  if (action === "action_generate_copy") return "Copy Generated";
  if (action === "action_generate_video_generation") return "Video Generation";
  if (action === "action_generate_video_render") return "Video Render";
  if (action === "monthly_grant") return "Monthly Credit Grant";
  return action.replace(/_/g, " ");
}

function actionEndpoint(action: string) {
  if (action === "api_weekly_promo_generate") return "POST /api/public/weekly-promo";
  return null;
}

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function DashboardHome() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/me/usage`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });

    fetch(`${API_BASE}/auth/session`, { credentials: "include" })
      .then((r) => r.json())
      .then((s) => { if (s?.user) setUser(s.user); })
      .catch(() => {});
  }, []);

  const dashboard = data?.dashboard;
  const credits = dashboard?.credits;
  const events = dashboard?.usageEvents ?? [];
  const hasApiUsage = events.some((e) => e.source === "public_api");
  const publicApiEvents = events.filter((e) => e.source === "public_api");
  const webEvents = events.filter((e) => e.source !== "public_api");

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="grid gap-5 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
      {/* Main column */}
      <section className="space-y-5 min-w-0">
        <motion.div variants={itemAnim}>
          <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Welcome back! 👋
          </h1>
          <p className="mt-1 text-sm text-[#8B8B8B]">
            Create, package, and post scroll-stopping content faster.
          </p>
        </motion.div>

        {loading ? (
          <motion.div variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-6 text-center text-sm text-[#8B8B8B]">
            Loading usage data...
          </motion.div>
        ) : error ? (
          <motion.div variants={itemAnim} className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            Could not load dashboard data. {error}
          </motion.div>
        ) : null}

        {dashboard && !loading && !error && (
          <>
            {/* Credits + Usage Overview grid */}
            <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-3">
              {/* Credits card */}
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
                <p className="text-sm font-semibold text-white">Credits Balance</p>
                <p className="mt-2 text-3xl font-semibold text-white md:text-4xl">
                  {credits?.totalBalance ?? "—"}{" "}
                  <span className="text-base font-normal text-[#8B8B8B]">credits</span>
                </p>
                <div className="mt-3 space-y-1 text-xs text-[#8B8B8B]">
                  <p>{credits?.generationBalance ?? 0} generation</p>
                  <p>{credits?.renderBalance ?? 0} render</p>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-[#1F1F1F]">
                  {credits && credits.totalBalance > 0 ? (
                    <div
                      className="h-1.5 rounded-full bg-white/20"
                      style={{ width: `${Math.min(100, (credits.totalBalance / 200) * 100)}%` }}
                    />
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-[#8B8B8B]">
                  {credits && credits.totalBalance > 0
                    ? `Enough for ~${Math.floor(credits.totalBalance / 5)} more weekly promos.`
                    : "No credits remaining."}
                </p>
              </div>

              {/* Credits Spent */}
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
                <p className="text-sm font-semibold text-white">Credits Used</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8B8B8B]">Last 7 days</span>
                    <span className="font-semibold text-white">{dashboard.creditsSpentLast7d}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8B8B8B]">Last 30 days</span>
                    <span className="font-semibold text-white">{dashboard.creditsSpentLast30d}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#1F1F1F] pt-2">
                    <span className="text-[#8B8B8B]">API calls (30d)</span>
                    <span className="font-semibold text-white">{dashboard.publicApiUsageCount}</span>
                  </div>
                </div>
              </div>

              {/* Buy Credits */}
              <div className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
                <p className="text-sm font-semibold text-white">Buy Credits</p>
                <p className="mt-1 text-xs text-[#8B8B8B]">
                  Purchase credit packs for API usage and content generation.
                </p>
                <div className="mt-3 space-y-2">
                  <div className="rounded-xl bg-[#111111] p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">100 generation credits</p>
                        <p className="text-xs text-[#8B8B8B]">~20 weekly promos</p>
                      </div>
                      <span className="text-sm font-semibold text-white">$9</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#111111] p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">500 generation credits</p>
                        <p className="text-xs text-[#8B8B8B]">~100 weekly promos</p>
                      </div>
                      <span className="text-sm font-semibold text-white">$29</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-dashed border-[#1F1F1F] bg-[#050505] p-3 text-center">
                  <p className="text-xs font-medium text-amber-400">Coming soon</p>
                  <p className="mt-0.5 text-[11px] text-[#8B8B8B]">Credit purchase via Lemon Squeezy is being set up.</p>
                </div>
                <p className="mt-2 text-[11px] text-[#555]">
                  1 weekly promo API call = 5 generation credits.
                </p>
              </div>
            </motion.div>

            {/* Recent Usage Events */}
            <motion.div variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-white md:text-lg">Recent Activity</h3>
                <span className="text-xs text-[#8B8B8B]">Last 20 events</span>
              </div>

              {events.length === 0 ? (
                <div className="rounded-xl bg-[#111111] p-4 text-center text-sm text-[#8B8B8B]">
                  No usage yet. Create content or call the API to see activity here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1F1F1F] text-left text-xs text-[#8B8B8B]">
                        <th className="pb-2 pr-3 font-medium">Action</th>
                        <th className="pb-2 pr-3 font-medium">Credits</th>
                        <th className="pb-2 pr-3 font-medium">Status</th>
                        <th className="pb-2 pr-3 font-medium">API Key</th>
                        <th className="pb-2 pr-3 font-medium">Endpoint</th>
                        <th className="pb-2 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev) => (
                        <tr key={ev.id} className="border-b border-[#1F1F1F]/50 text-[#A3A3A3]">
                          <td className="py-2.5 pr-3 text-white">{actionLabel(ev.action)}</td>
                          <td className="py-2.5 pr-3">{ev.creditsAmount ?? "—"}</td>
                          <td className="py-2.5 pr-3">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] ${ev.source === "public_api" ? "bg-blue-500/15 text-blue-300" : "bg-[#1F1F1F] text-slate-300"}`}>
                              {ev.source === "public_api" ? "API" : "Web"}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 font-mono text-xs">{ev.keyPrefix ?? "—"}</td>
                          <td className="py-2.5 pr-3 text-xs">{actionEndpoint(ev.action) ?? "—"}</td>
                          <td className="py-2.5 text-xs whitespace-nowrap">{formatDate(ev.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Developer Onboarding */}
            <motion.div variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
              <h3 className="text-base font-semibold text-white md:text-lg">API Quick Start</h3>
              <p className="mt-1 text-xs text-[#8B8B8B]">
                Generate content programmatically with your API key.
              </p>

              <div className="mt-4 rounded-xl bg-[#111111] p-4 font-mono text-xs leading-relaxed text-[#A3A3A3]">
                <p className="text-white font-semibold mb-2 text-sm not-italic">POST https://api.talocode.site/v1/cliplane/weekly-promo</p>
                <p><span className="text-white">Headers:</span></p>
                <p className="ml-3">Authorization: Bearer &lt;your_api_key&gt;</p>
                <p className="ml-3">Idempotency-Key: &lt;unique_key&gt;</p>
                <p className="mt-2"><span className="text-white">Body:</span></p>
                <p className="ml-3">{'{'}</p>
                <p className="ml-5">"brandName": "Your Brand",</p>
                <p className="ml-5">"offer": "Describe your offer",</p>
                <p className="ml-5">"audience": "Target audience"</p>
                <p className="ml-3">{'}'}</p>
              </div>

              {!hasApiUsage && (
                <div className="mt-3 rounded-xl border border-dashed border-[#1F1F1F] bg-[#050505] p-3 text-center text-xs text-[#8B8B8B]">
                  No API usage yet. Generate an API key and call the public weekly promo endpoint.
                </div>
              )}
            </motion.div>
          </>
        )}
      </section>

      {/* Right sidebar */}
      <aside className="space-y-4">
        {/* API Keys */}
        <motion.section variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">API Keys</p>
            <Link to="/dashboard/settings/api-keys" className="text-xs text-[#8B8B8B] hover:text-white">
              Manage →
            </Link>
          </div>
          {dashboard?.apiKeys && dashboard.apiKeys.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {dashboard.apiKeys.map((key) => (
                <li key={key.id} className="flex items-center justify-between rounded-xl bg-[#111111] p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{key.label}</p>
                    <p className="font-mono text-xs text-[#8B8B8B]">{key.keyPrefix}...</p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] ${key.status === "active" ? "bg-green-500/15 text-green-300" : "bg-[#1F1F1F] text-[#8B8B8B]"}`}>
                    {key.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 rounded-xl bg-[#111111] p-3 text-center text-xs text-[#8B8B8B]">
              No API keys yet.
            </div>
          )}
        </motion.section>

        {/* Usage Breakdown */}
        {dashboard?.breakdownByAction && Object.keys(dashboard.breakdownByAction).length > 0 ? (
          <motion.section variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
            <p className="text-sm font-semibold text-white">Usage by Action</p>
            <div className="mt-3 space-y-2 text-sm">
              {Object.entries(dashboard.breakdownByAction).map(([action, count]) => (
                <div key={action} className="flex items-center justify-between">
                  <span className="text-[#8B8B8B]">{actionLabel(action)}</span>
                  <span className="font-semibold text-white">{count}</span>
                </div>
              ))}
            </div>
          </motion.section>
        ) : null}

        {/* Plan */}
        <motion.section variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#0E0E0E] text-white text-xs font-semibold">
                {user ? (user.name || user.email).slice(0, 2).toUpperCase() : "?"}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{user?.name || "Account"}</p>
                <p className="text-xs text-[#8B8B8B]">{user?.email || ""}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Tips */}
        <motion.section variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
          <p className="text-sm font-semibold text-white">Tips to get better results</p>
          <ul className="mt-4 space-y-3 text-sm text-[#8B8B8B]">
            {[
              { icon: "🔎", title: "Be specific with your idea", desc: "Add details about your audience, offer and goal." },
              { icon: "📣", title: "Choose the right channel", desc: "Different platforms need different styles." },
              { icon: "🏷️", title: "Use your brand context", desc: "Import your site or add more brand info." },
            ].map((tip) => (
              <li key={tip.title} className="flex gap-3">
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-2xl bg-[#111111] text-slate-200">
                  {tip.icon}
                </span>
                <div>
                  <p className="font-medium text-white">{tip.title}</p>
                  <p className="text-xs text-[#8B8B8B]">{tip.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>
      </aside>
    </motion.div>
  );
}
