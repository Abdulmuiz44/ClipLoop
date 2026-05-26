"use client";

import { useEffect, useMemo, useState } from "react";

type ApiKeyRow = {
  id: string;
  label: string;
  keyPrefix: string;
  status: "active" | "revoked" | string;
  scopes: string[];
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
};

type CreateResponse = {
  apiKey: string;
  apiKeyId: string;
  keyPrefix: string;
  label: string;
  scopes: string[];
  createdAt: string;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().replace("T", " ").slice(0, 16);
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const canCreate = useMemo(() => label.trim().length >= 3, [label]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/api-keys", { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Failed to load API keys (${res.status}).`);
      setKeys(Array.isArray(data?.keys) ? data.keys : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate() {
    if (!canCreate) return;
    setCreating(true);
    setError(null);
    setRevealedKey(null);
    try {
      const res = await fetch("/api/me/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<CreateResponse> & { error?: string };
      if (!res.ok) throw new Error(data?.error || `Failed to create API key (${res.status}).`);

      if (typeof data.apiKey === "string") {
        setRevealedKey(data.apiKey);
      }
      setLabel("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  async function onRevoke(id: string) {
    const yes = confirm("Revoke this API key? It will stop working immediately.");
    if (!yes) return;

    setError(null);
    try {
      const res = await fetch("/api/me/api-keys/revoke", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKeyId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Failed to revoke API key (${res.status}).`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function copyKey() {
    if (!revealedKey) return;
    await navigator.clipboard.writeText(revealedKey);
    alert("Copied. Save it now — you won’t see it again.");
  }

  return (
    <div className="space-y-6">
      <section className="cl-card p-6 text-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">Create API key</h2>
            <p className="mt-1 text-slate-600">API keys are shown once. Store it somewhere safe.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t pt-5 cl-divider sm:grid-cols-[1fr_auto]">
          <div>
            <label className="block text-xs font-semibold text-slate-600">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. TradiaAI server"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
            />
            <p className="mt-2 text-[11px] text-slate-500">Default scope: weekly_promo:generate</p>
          </div>
          <button
            onClick={() => void onCreate()}
            disabled={!canCreate || creating}
            className="h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create key"}
          </button>
        </div>

        {revealedKey ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold text-emerald-900">Your new API key (shown once)</p>
            <code className="mt-2 block break-all rounded-lg bg-white/70 p-3 text-[12px] text-emerald-950">{revealedKey}</code>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => void copyKey()} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">
                Copy
              </button>
              <button onClick={() => setRevealedKey(null)} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-900">
                I saved it
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-xs text-rose-600">{error}</p> : null}
      </section>

      <section className="cl-card p-6 text-sm">
        <div className="flex items-end justify-between gap-4 border-b pb-4 cl-divider">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">Your API keys</h2>
            <p className="mt-1 text-slate-600">Use these keys to call the public API.</p>
          </div>
          <button onClick={() => void load()} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading…</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <tr className="border-b cl-divider">
                  <th className="pb-3 pr-3">Label</th>
                  <th className="pb-3 pr-3">Prefix</th>
                  <th className="pb-3 pr-3">Status</th>
                  <th className="pb-3 pr-3">Scopes</th>
                  <th className="pb-3 pr-3">Created</th>
                  <th className="pb-3 pr-3">Last used</th>
                  <th className="pb-3 pr-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y cl-divider">
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td className="py-3 pr-3 font-medium text-slate-900">{k.label}</td>
                    <td className="py-3 pr-3 font-mono text-[11px] text-slate-700">{k.keyPrefix}…</td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          k.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-[11px] text-slate-600">{(k.scopes || []).join(", ") || "-"}</td>
                    <td className="py-3 pr-3 text-slate-500">{formatDate(k.createdAt)}</td>
                    <td className="py-3 pr-3 text-slate-500">{formatDate(k.lastUsedAt)}</td>
                    <td className="py-3 pr-3 text-right">
                      {k.status === "active" ? (
                        <button onClick={() => void onRevoke(k.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                          Revoke
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {keys.length === 0 ? <p className="py-10 text-center text-xs text-slate-500">No API keys yet.</p> : null}
          </div>
        )}
      </section>

      <section className="cl-card p-6 text-sm">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">Quick start</h2>
        <p className="mt-1 text-slate-600">Example request to generate a weekly promo.</p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-[11px] text-slate-100">
{`curl -X POST "https://www.cliploop.site/api/public/weekly-promo" \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Idempotency-Key: my-request-001" \\
  -H "Content-Type: application/json" \\
  -d '{}'`}
        </pre>
      </section>
    </div>
  );
}
