import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.DEV ? "/api" : "https://app.cliploop.site/api";

type ApiKey = {
  id: string;
  label: string;
  keyPrefix: string;
  status: "active" | "revoked";
  scopes: string[];
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
};

type ApiKeyCreated = {
  apiKey: string;
  apiKeyId: string;
  keyPrefix: string;
  label: string;
  scopes: string[];
  createdAt: string;
};

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate key state
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Newly created raw key — shown once
  const [newKey, setNewKey] = useState<ApiKeyCreated | null>(null);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Revoke state
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function fetchKeys() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/me/api-keys`);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
      }
      const json = await res.json();
      setKeys(json.keys ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKeys();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;

    setIsGenerating(true);
    setGenError(null);
    setNewKey(null);

    try {
      const res = await fetch(`${API_BASE}/me/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: trimmed,
          scopes: ["weekly_promo:generate"],
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? json.message ?? `HTTP ${res.status}`);
      }

      setNewKey(json as ApiKeyCreated);
      setShowForm(false);
      setLabel("");
      // Refresh key list
      fetchKeys();
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : "Failed to generate API key");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRevoke(apiKeyId: string) {
    if (!confirm("Revoke this API key? It will stop working immediately.")) return;

    setRevokingId(apiKeyId);
    try {
      const res = await fetch(`${API_BASE}/me/api-keys/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKeyId }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? json.message ?? `HTTP ${res.status}`);
      }

      await fetchKeys();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to revoke API key";
      alert(msg);
    } finally {
      setRevokingId(null);
    }
  }

  function handleCopyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey.apiKey).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      },
      () => {
        // Fallback: select text manually
        setCopied(false);
      },
    );
  }

  function dismissNewKey() {
    setNewKey(null);
    setCopied(false);
  }

  const activeKeys = keys.filter((k) => k.status === "active");
  const revokedKeys = keys.filter((k) => k.status === "revoked");

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Header */}
      <motion.div variants={itemAnim}>
        <h1 className="text-xl font-semibold text-white md:text-2xl">API Keys</h1>
        <p className="mt-1 text-sm text-[#8B8B8B]">
          Manage your developer API keys for programmatic access.
        </p>
      </motion.div>

      {/* Loading */}
      {loading && (
        <motion.div variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-6 text-center text-sm text-[#8B8B8B]">
          Loading API keys...
        </motion.div>
      )}

      {/* Error loading */}
      {!loading && error && (
        <motion.div variants={itemAnim} className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </motion.div>
      )}

      {/* ===== Newly created key banner ===== */}
      {newKey && (
        <motion.div variants={itemAnim} className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p className="text-sm font-semibold text-emerald-300">API Key Created</p>
          <p className="mt-1 text-xs text-emerald-300/70">
            Copy this key now — it will <strong>not</strong> be shown again.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 select-all break-all rounded-xl bg-[#0A0A0A] px-3 py-2 font-mono text-xs text-white">
              {newKey.apiKey}
            </code>
            <button
              onClick={handleCopyKey}
              className="flex-shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-neutral-200"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-xs text-[#8B8B8B]">
            Label: {newKey.label} &middot; Scopes: {newKey.scopes.join(", ")} &middot; Created: {formatDate(newKey.createdAt)}
          </p>
          <button
            onClick={dismissNewKey}
            className="mt-3 text-xs text-[#8B8B8B] hover:text-white"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* ===== Generate form ===== */}
      {showForm && (
        <motion.div variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-5">
          <p className="text-sm font-semibold text-white">New API Key</p>
          <p className="mt-1 text-xs text-[#8B8B8B]">
            Give your key a label so you can identify it later. It will have the <code className="text-white">weekly_promo:generate</code> scope.
          </p>
          <form onSubmit={handleGenerate} className="mt-4 space-y-3">
            <div>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Production weekly promo"
                maxLength={64}
                autoFocus
                className="w-full rounded-xl border border-[#1F1F1F] bg-[#111111] px-3 py-2 text-sm text-white placeholder-[#8B8B8B] outline-none focus:border-white/30"
              />
            </div>
            {genError && (
              <p className="text-xs text-rose-400">{genError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!label.trim() || isGenerating}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200 disabled:opacity-40"
              >
                {isGenerating ? "Generating..." : "Create Key"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setGenError(null); setLabel(""); }}
                className="rounded-xl border border-[#1F1F1F] px-4 py-2 text-sm text-[#8B8B8B] hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* ===== Active keys ===== */}
      {!loading && !error && !showForm && (
        <motion.div variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E]">
          <div className="flex items-center justify-between border-b border-[#1F1F1F] px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-white">Active Keys</p>
              <p className="text-xs text-[#8B8B8B]">{activeKeys.length} key{activeKeys.length !== 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200"
            >
              + Generate API Key
            </button>
          </div>

          {activeKeys.length === 0 ? (
            <div className="p-5 text-center text-sm text-[#8B8B8B]">
              No API keys yet. Click "Generate API Key" to create one.
            </div>
          ) : (
            <div className="divide-y divide-[#1F1F1F]/50">
              {activeKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{key.label}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8B8B8B]">
                      <span className="font-mono">{key.keyPrefix}...</span>
                      <span>{key.scopes.join(", ")}</span>
                      <span>Created {formatDate(key.createdAt)}</span>
                      {key.lastUsedAt && <span>Last used {formatDate(key.lastUsedAt)}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(key.id)}
                    disabled={revokingId === key.id}
                    className="flex-shrink-0 rounded-xl border border-rose-500/30 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 disabled:opacity-40"
                  >
                    {revokingId === key.id ? "Revoking..." : "Revoke"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ===== Revoked keys ===== */}
      {!loading && !error && revokedKeys.length > 0 && (
        <motion.div variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-5">
          <p className="text-sm font-semibold text-white">Revoked Keys</p>
          <div className="mt-3 space-y-2">
            {revokedKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between rounded-xl bg-[#111111] p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#8B8B8B] line-through">{key.label}</p>
                  <p className="mt-0.5 font-mono text-xs text-[#555]">{key.keyPrefix}...</p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-[#1F1F1F] px-2 py-0.5 text-[11px] text-[#8B8B8B]">
                  Revoked
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
