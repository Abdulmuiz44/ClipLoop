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

      {/* ===== API Quick Start ===== */}
      {!loading && !error && (
        <motion.div variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E]">
          <ApiQuickStart keys={activeKeys} />
        </motion.div>
      )}
    </motion.div>
  );
}

function ApiQuickStart({ keys }: { keys: ApiKey[] }) {
  const [open, setOpen] = useState(false);
  const [endpointCopied, setEndpointCopied] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);

  const endpoint = "POST https://app.cliploop.site/api/public/weekly-promo";
  const sampleKey = keys.length > 0 ? `${keys[0].keyPrefix}...` : "clp_YOUR_API_KEY";

  const curlExample = `curl -X POST https://app.cliploop.site/api/public/weekly-promo \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -H "Idempotency-Key: my-unique-key-abc123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "appName": "MyApp",
    "appWebsiteUrl": "https://myapp.com",
    "weeklyUpdate": "Launched v2 with real-time collaboration",
    "channel": "tiktok",
    "tone": "energetic"
  }'`;

  function copy(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(
      () => { setter(true); setTimeout(() => setter(false), 2500); },
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-white">API Quick Start</p>
          <p className="text-xs text-[#8B8B8B]">Copy endpoint, curl example, and error codes</p>
        </div>
        <span className={`text-[#8B8B8B] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="space-y-5 border-t border-[#1F1F1F] px-5 pb-5 pt-4"
        >
          {/* Security warning */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            ⚠ Keep your API key secret. Never share it or commit it to code. Store it in environment variables
            or a secrets manager. The full key is shown <strong>once</strong> at creation.
          </div>

          {/* Endpoint */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-white">Endpoint</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 select-all break-all rounded-xl bg-[#0A0A0A] px-3 py-2 font-mono text-xs text-emerald-300">
                {endpoint}
              </code>
              <button
                onClick={() => copy(endpoint, setEndpointCopied)}
                className="flex-shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-neutral-200"
              >
                {endpointCopied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* curl example */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-white">curl</p>
            <div className="relative">
              <pre className="overflow-x-auto rounded-xl bg-[#0A0A0A] p-3 font-mono text-xs text-white/80">
                {curlExample}
              </pre>
              <button
                onClick={() => copy(curlExample, setCurlCopied)}
                className="absolute right-2 top-2 rounded-lg bg-white/10 px-2 py-1 text-[11px] text-white/60 hover:bg-white/20"
              >
                {curlCopied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* JS fetch */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-white">JavaScript (fetch)</p>
            <pre className="overflow-x-auto rounded-xl bg-[#0A0A0A] p-3 font-mono text-xs text-white/80">{`const res = await fetch("https://app.cliploop.site/api/public/weekly-promo", {
  method: "POST",
  headers: {
    Authorization: "Bearer ${sampleKey}",
    "Idempotency-Key": "my-unique-key-abc123",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    appName: "MyApp",
    weeklyUpdate: "Launched v2 with real-time collaboration",
    channel: "tiktok",
    tone: "energetic",
  }),
});
const data = await res.json();
console.log(data.script.hook, data.creditsCharged);`}</pre>
          </div>

          {/* Error codes */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-white">Error Codes</p>
            <div className="overflow-x-auto rounded-xl bg-[#0A0A0A] p-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#8B8B8B]">
                    <th className="pb-1.5 pr-4 font-medium">Code</th>
                    <th className="pb-1.5 pr-4 font-medium">Status</th>
                    <th className="pb-1.5 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  <tr><td className="py-1 pr-4 font-mono text-rose-300">API_KEY_MISSING</td><td className="py-1 pr-4">401</td><td className="py-1">No Authorization header</td></tr>
                  <tr><td className="py-1 pr-4 font-mono text-rose-300">API_KEY_INVALID</td><td className="py-1 pr-4">401</td><td className="py-1">Key not found, revoked, or malformed</td></tr>
                  <tr><td className="py-1 pr-4 font-mono text-rose-300">SCOPE_DENIED</td><td className="py-1 pr-4">403</td><td className="py-1">Missing weekly_promo:generate scope</td></tr>
                  <tr><td className="py-1 pr-4 font-mono text-yellow-300">IDEMPOTENCY_KEY_REQUIRED</td><td className="py-1 pr-4">400</td><td className="py-1">Header missing or too short</td></tr>
                  <tr><td className="py-1 pr-4 font-mono text-yellow-300">IDEMPOTENCY_CONFLICT</td><td className="py-1 pr-4">409</td><td className="py-1">Same key, different request body</td></tr>
                  <tr><td className="py-1 pr-4 font-mono text-yellow-300">IDEMPOTENCY_IN_PROGRESS</td><td className="py-1 pr-4">409</td><td className="py-1">Request still in progress</td></tr>
                  <tr><td className="py-1 pr-4 font-mono text-blue-300">RATE_LIMIT_EXCEEDED</td><td className="py-1 pr-4">429</td><td className="py-1">3 requests per 60 sec</td></tr>
                  <tr><td className="py-1 pr-4 font-mono text-orange-300">CREDITS_INSUFFICIENT</td><td className="py-1 pr-4">402</td><td className="py-1">Not enough credits</td></tr>
                  <tr><td className="py-1 pr-4 font-mono text-orange-300">VALIDATION_ERROR</td><td className="py-1 pr-4">400</td><td className="py-1">Body failed validation</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Docs link */}
          <div className="pt-1">
            <a
              href="https://github.com/talocode/cliploop/blob/main/docs/PUBLIC_API.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              View full API docs on GitHub →
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}
