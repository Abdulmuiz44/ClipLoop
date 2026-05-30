import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.DEV ? "/api" : "https://app.cliploop.site/api";

// ── Credit pack config (mirrors src/core/billing/policy.ts) ──
interface CreditPack {
  id: string;
  label: string;
  description: string;
  credits: number;
  priceUsd: number;
  bucket: "generation" | "render";
}

const CREDIT_PACKS: CreditPack[] = [
  { id: "starter_generation", label: "Starter Generation", description: "100 generation credits — ~20 weekly promos or 100 copy generations", credits: 100, priceUsd: 9, bucket: "generation" },
  { id: "pro_generation", label: "Pro Generation", description: "500 generation credits — bulk rate for high-volume usage", credits: 500, priceUsd: 29, bucket: "generation" },
  { id: "render_pack", label: "Render Pack", description: "50 render credits for video rendering", credits: 50, priceUsd: 19, bucket: "render" },
];

interface WalletData {
  generationBalance: number;
  renderBalance: number;
  totalBalance: number;
  creditsSpentLast7d: number;
  creditsSpentLast30d: number;
  publicApiUsageCount: number;
}

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    api_weekly_promo_generate: "Weekly Promo (API)",
    action_generate_copy: "Copy Generated",
    action_generate_video_generation: "Video Generation",
    action_generate_video_render: "Video Render",
    monthly_grant: "Monthly Credit Grant",
    purchase: "Credit Purchase",
  };
  return map[action] ?? action.replace(/_/g, " ");
}

export default function BillingPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Array<{ id: string; action: string; creditsAmount: number | null; createdAt: string; bucket: string; direction: string }>>([]);

  useEffect(() => {
    fetch(`${API_BASE}/me/usage`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const d = json.dashboard;
        setWallet({
          generationBalance: d.credits.generationBalance,
          renderBalance: d.credits.renderBalance,
          totalBalance: d.credits.totalBalance,
          creditsSpentLast7d: d.creditsSpentLast7d,
          creditsSpentLast30d: d.creditsSpentLast30d,
          publicApiUsageCount: d.publicApiUsageCount,
        });
        setTransactions(
          (d.usageEvents ?? []).map((e: Record<string, unknown>) => ({
            id: e.id as string,
            action: e.action as string,
            creditsAmount: (e.creditsAmount as number) ?? null,
            createdAt: e.createdAt as string,
            bucket: (e.creditsBucket as string) ?? "",
            direction: (e.creditsAmount as number) != null && (e.creditsAmount as number) > 0 ? "credit" : "debit",
          }))
        );
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemAnim}>
        <h1 className="text-xl font-semibold text-white md:text-2xl">Credits & Billing</h1>
        <p className="mt-1 text-sm text-[#8B8B8B]">Manage your credits, view usage, and purchase more.</p>
      </motion.div>

      {loading ? (
        <motion.div variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-6 text-center text-sm text-[#8B8B8B]">Loading...</motion.div>
      ) : error ? (
        <motion.div variants={itemAnim} className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</motion.div>
      ) : wallet ? (
        <>
          {/* Wallet overview */}
          <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#8B8B8B]">Total Balance</p>
              <p className="mt-1.5 text-3xl font-semibold text-white">{wallet.totalBalance} <span className="text-base font-normal text-[#8B8B8B]">credits</span></p>
              <p className="mt-1 text-xs text-[#555]">~{Math.floor(wallet.totalBalance / 5)} weekly promos</p>
            </div>
            <div className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#8B8B8B]">Generation</p>
              <p className="mt-1.5 text-3xl font-semibold text-white">{wallet.generationBalance}</p>
              <p className="mt-1 text-xs text-[#555]">For LLM prompts & API calls</p>
            </div>
            <div className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#8B8B8B]">Render</p>
              <p className="mt-1.5 text-3xl font-semibold text-white">{wallet.renderBalance}</p>
              <p className="mt-1 text-xs text-[#555]">For video rendering</p>
            </div>
            <div className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#8B8B8B]">Used (30d)</p>
              <p className="mt-1.5 text-3xl font-semibold text-white">{wallet.creditsSpentLast30d}</p>
              <p className="mt-1 text-xs text-[#555]">{wallet.creditsSpentLast7d} in last 7 days</p>
            </div>
          </motion.div>

          {/* Credit packs */}
          <motion.div variants={itemAnim}>
            <h2 className="text-lg font-semibold text-white">Buy Credits</h2>
            <p className="mt-0.5 text-sm text-[#8B8B8B]">Purchase one-time credit packs. Credits never expire.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {CREDIT_PACKS.map((pack) => (
                <div key={pack.id} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-5 transition hover:border-neutral-700">
                  {pack.bucket === "render" && (
                    <span className="mb-3 inline-block rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-medium text-blue-300">Render credits</span>
                  )}
                  <p className="text-base font-semibold text-white">{pack.label}</p>
                  <p className="mt-1 text-xs text-[#8B8B8B]">{pack.description}</p>
                  <p className="mt-4 text-2xl font-semibold text-white">
                    ${pack.priceUsd}
                    <span className="ml-1 text-sm font-normal text-[#8B8B8B]">one-time</span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#555]">${(pack.priceUsd / pack.credits).toFixed(2)} / credit</p>
                  <div className="mt-5 rounded-xl border border-dashed border-[#1F1F1F] bg-[#050505] p-3 text-center">
                    <p className="text-xs font-medium text-amber-400">Coming soon</p>
                    <p className="mt-0.5 text-[11px] text-[#8B8B8B]">Checkout via Lemon Squeezy</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* API cost table */}
          <motion.div variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
            <h2 className="text-base font-semibold text-white">Credit Costs</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1F1F1F] text-left text-xs text-[#8B8B8B]">
                    <th className="pb-2 pr-4 font-medium">Action</th>
                    <th className="pb-2 pr-4 font-medium">Bucket</th>
                    <th className="pb-2 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { action: "API weekly promo", bucket: "Generation", cost: "5 credits" },
                    { action: "Copy generation (chat)", bucket: "Generation", cost: "1 credit" },
                    { action: "Video generation (chat)", bucket: "Generation", cost: "1 credit" },
                    { action: "Video render (chat)", bucket: "Render", cost: "1 credit" },
                    { action: "Strategy cycle", bucket: "Generation", cost: "5 credits" },
                  ].map((row) => (
                    <tr key={row.action} className="border-b border-[#1F1F1F]/50 text-[#A3A3A3] last:border-0">
                      <td className="py-2.5 pr-4 text-white">{row.action}</td>
                      <td className="py-2.5 pr-4">{row.bucket}</td>
                      <td className="py-2.5">{row.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-[#555]">
              Monthly grants (generation + render) are applied automatically at the start of each billing period.
              {wallet.publicApiUsageCount > 0 && ` You've made ${wallet.publicApiUsageCount} API calls this month.`}
            </p>
          </motion.div>

          {/* Recent transactions */}
          {transactions.length > 0 && (
            <motion.div variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4">
              <h2 className="text-base font-semibold text-white">Recent Transactions</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1F1F1F] text-left text-xs text-[#8B8B8B]">
                      <th className="pb-2 pr-4 font-medium">Action</th>
                      <th className="pb-2 pr-4 font-medium">Amount</th>
                      <th className="pb-2 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 20).map((tx) => (
                      <tr key={tx.id} className="border-b border-[#1F1F1F]/50 text-[#A3A3A3] last:border-0">
                        <td className="py-2.5 pr-4 text-white">{actionLabel(tx.action)}</td>
                        <td className="py-2.5 pr-4">
                          <span className={tx.direction === "credit" ? "text-green-400" : "text-white"}>
                            {tx.direction === "credit" ? "+" : ""}{tx.creditsAmount}
                          </span>
                        </td>
                        <td className="py-2.5">{formatDate(tx.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      ) : null}
    </motion.div>
  );
}
