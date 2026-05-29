"use client";

import { useEffect, useState } from "react";

type UsageEvent = {
  id: string;
  action: string;
  source: string;
  creditsBucket: string | null;
  creditsAmount: number | null;
  createdAt: string;
  keyPrefix: string | null;
};

type ApiKey = {
  id: string;
  label: string;
  keyPrefix: string;
  status: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
};

type DashboardData = {
  credits: {
    generationBalance: number;
    renderBalance: number;
    totalBalance: number;
    periodKey: string;
  };
  usageEvents: UsageEvent[];
  breakdownByAction: Record<string, number>;
  publicApiUsageCount: number;
  creditsSpentLast7d: number;
  creditsSpentLast30d: number;
  apiKeys: ApiKey[];
};

export function DashboardUsageSection() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me/usage")
      .then((r) => r.json())
      .then((json) => {
        if (json.dashboard) {
          setData(json.dashboard as DashboardData);
        }
      })
      .catch(() => setError("Failed to load usage data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Usage & API</h3>
        <p className="mt-6 py-8 text-center text-xs text-slate-500">Loading usage data…</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Usage & API</h3>
        <p className="mt-6 py-8 text-center text-xs text-rose-500">{error || "Could not load usage data."}</p>
      </section>
    );
  }

  const hasUsage = data.usageEvents.length > 0;
  const hasApiKeys = data.apiKeys.length > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Usage & API</h3>

      {/* Credits summary */}
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-500">Credits Remaining</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{data.credits.totalBalance}</p>
          <p className="text-[11px] text-slate-400">Generation: {data.credits.generationBalance} • Render: {data.credits.renderBalance}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-500">Credits Spent (7d)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{data.creditsSpentLast7d}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-500">Credits Spent (30d)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{data.creditsSpentLast30d}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs text-slate-500">Public API Calls</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{data.publicApiUsageCount}</p>
          <p className="text-[11px] text-slate-400">via API key</p>
        </div>
      </div>

      {/* Breakdown by action */}
      {Object.keys(data.breakdownByAction).length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(data.breakdownByAction).map(([action, count]) => (
            <span
              key={action}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-700 dark:bg-slate-700 dark:text-slate-200"
            >
              <span className="font-semibold">{action}</span>
              <span className="text-slate-400">×{count}</span>
            </span>
          ))}
        </div>
      ) : null}

      {/* Empty state */}
      {!hasUsage ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500">
            No API usage yet. Generate an API key and call the public weekly promo endpoint.
          </p>
        </div>
      ) : (
        <>
          {/* Recent API usage table */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <tr className="border-b cl-divider dark:border-slate-700">
                  <th className="pb-3 pr-3">Action</th>
                  <th className="pb-3 pr-3">Credits</th>
                  <th className="pb-3 pr-3">Source</th>
                  <th className="pb-3 pr-3">API Key Prefix</th>
                  <th className="pb-3 pr-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y cl-divider dark:divide-slate-700">
                {data.usageEvents.map((ev) => (
                  <tr key={ev.id}>
                    <td className="py-3 pr-3 font-medium text-slate-900 dark:text-white">
                      {ev.action}
                      {ev.action === "api_weekly_promo_generate" ? (
                        <span className="ml-2 text-[10px] text-slate-400">POST /api/public/weekly-promo</span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 text-slate-600">
                      {ev.creditsAmount != null ? `${Math.abs(ev.creditsAmount)}` : "-"}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          ev.source === "public_api"
                            ? "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {ev.source === "public_api" ? "API" : "Web"}
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-mono text-[11px] text-slate-500">
                      {ev.keyPrefix ? `${ev.keyPrefix}…` : "-"}
                    </td>
                    <td className="py-3 pr-3 text-slate-500 whitespace-nowrap">
                      {formatRelativeTime(ev.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* API key list (prefix only) */}
      {hasApiKeys ? (
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Your API Keys</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.apiKeys.map((k) => (
              <span
                key={k.id}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono ${
                  k.status === "active"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-700"
                }`}
              >
                {k.keyPrefix}…
                <span className="text-[10px] font-normal opacity-60">{k.label}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Developer copy */}
      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Quick Start — Public API</p>
        <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 p-4 text-[11px] text-slate-100">
{`Endpoint:
  POST https://app.cliploop.site/api/public/weekly-promo

Required headers:
  Authorization: Bearer <api_key>
  Idempotency-Key: <unique_key>

Example:
  curl -X POST "https://app.cliploop.site/api/public/weekly-promo" \\
    -H "Authorization: Bearer clp_..." \\
    -H "Idempotency-Key: my-req-001" \\
    -H "Content-Type: application/json" \\
    -d '{
      "appName": "MyApp",
      "weeklyUpdate": "Shipped a new onboarding flow this week.",
      "channel": "instagram",
      "tone": "direct"
    }'`}
        </pre>
      </div>
    </section>
  );
}

export function DashboardBalanceDisplay() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/me/usage")
      .then((r) => r.json())
      .then((json) => {
        if (json?.dashboard?.credits?.totalBalance != null) {
          setBalance(json.dashboard.credits.totalBalance);
        }
      })
      .catch(() => {});
  }, []);

  if (balance === null) return <>{127}</>;
  return <>{balance}</>;
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}
