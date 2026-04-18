"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ClipLoopLogo } from "@/components/ui/cliploop-logo";

type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  kind: "text" | "status" | "result";
  content: string;
  metadataJson?: Record<string, unknown>;
  createdAt: string;
};

type ChatMode = "chat" | "generate_copy" | "generate_video";

function friendlyApiError(payload: Record<string, unknown>) {
  const code = typeof payload.code === "string" ? payload.code : "";
  const suggestion = typeof payload.suggestion === "string" ? payload.suggestion : "";
  if (code === "PROJECT_LIMIT_REACHED") {
    return "You reached your project limit. Upgrade to Pro to create more projects.";
  }
  if (code.includes("POSTS_")) {
    return "You are out of generation credits for this period. Upgrade to Pro for more.";
  }
  if (code.includes("RENDER_")) {
    return "You are out of render credits for this period. Upgrade to Pro for more.";
  }
  if (code === "CREDITS_INSUFFICIENT") {
    const bucket = typeof payload.bucket === "string" ? payload.bucket : "generation";
    const available = typeof payload.available === "number" ? payload.available : 0;
    const required = typeof payload.required === "number" ? payload.required : 1;
    return `You need ${required} ${bucket} credits but only have ${available}. Upgrade to Pro to continue.`;
  }
  if (code === "PRODUCT_ACCESS_DENIED") {
    return "Access is currently limited for this account. Open pricing or request access to continue.";
  }
  const base = (typeof payload.error === "string" && payload.error) || "Request failed.";
  return suggestion ? `${base} ${suggestion}` : base;
}

export function ChatWorkspace(props: {
  initialConversations: Conversation[];
  initialConversationId: string | null;
  initialMessages: Message[];
  creditSummary: {
    planLabel: string;
    generationRemaining: number;
    generationLimit: number;
    renderRemaining: number;
    renderLimit: number;
  };
}) {
  const [conversations, setConversations] = useState<Conversation[]>(props.initialConversations);
  const [creditSummary, setCreditSummary] = useState(props.creditSummary);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(props.initialConversationId);
  const [messages, setMessages] = useState<Message[]>(props.initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>("chat");

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  async function loadMessages(conversationId: string) {
    const response = await fetch(`/api/chat/conversations/${conversationId}/messages`);
    const json = await response.json();
    if (response.ok) {
      const nextMessages = (json.messages ?? []).map((m: Message) => ({ ...m, metadataJson: m.metadataJson ?? {} }));
      setMessages(nextMessages);
      const walletUpdate = findWalletFromMessages(nextMessages);
      if (walletUpdate) {
        setCreditSummary((prev) => ({
          ...prev,
          generationRemaining: walletUpdate.generation,
          renderRemaining: walletUpdate.render,
        }));
      }
    }
  }

  async function createConversation() {
    const response = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.conversation) return;
    const next: Conversation = {
      ...json.conversation,
      createdAt: new Date(json.conversation.createdAt).toISOString(),
      updatedAt: new Date(json.conversation.updatedAt).toISOString(),
    };
    setConversations((prev) => [next, ...prev]);
    setActiveConversationId(next.id);
    setMessages([]);
    setSidebarOpen(false);
  }

  async function selectConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setSidebarOpen(false);
    await loadMessages(conversationId);
  }

  async function sendMessage() {
    if (!activeConversationId || !input.trim()) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    const optimistic: Message = {
      id: `local-${Date.now()}`,
      role: "user",
      kind: "text",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const response = await fetch(`/api/chat/conversations/${activeConversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, mode }),
    });
    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (response.ok) {
      await loadMessages(activeConversationId);
      if (activeConversation?.title === "New chat") {
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversationId ? { ...c, title: content.slice(0, 70), updatedAt: new Date().toISOString() } : c)),
        );
      }
    } else {
      const code = typeof json.code === "string" ? json.code : "";
      const upgradeHint =
        code === "CREDITS_INSUFFICIENT" || code.includes("POSTS_") || code.includes("RENDER_") || code === "PROJECT_LIMIT_REACHED"
          ? "\nOpen /pricing to upgrade."
          : "";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          kind: "text",
          content: `${friendlyApiError(json)}${upgradeHint}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setSending(false);
  }

  return (
    <div className="relative -mx-4 flex min-h-[calc(100vh-5rem)] bg-slate-50 md:mx-0 md:overflow-hidden md:rounded-3xl md:border md:cl-divider">
      {sidebarOpen ? (
        <button
          type="button"
          className="absolute inset-0 z-20 bg-slate-900/20 md:hidden"
          aria-label="Close navigation drawer"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <aside
        className={`absolute inset-y-0 left-0 z-30 w-[18.5rem] border-r bg-white p-4 transition-transform cl-divider md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b pb-4 cl-divider">
          <ClipLoopLogo compact={false} />
          <button
            className="rounded-lg border px-2.5 py-1.5 text-xs text-slate-700 transition cl-divider md:hidden"
            onClick={() => setSidebarOpen(false)}
            type="button"
          >
            Close
          </button>
        </div>

        <nav className="mt-4 space-y-1 text-sm">
          <NavLink href="/app" label="Workspace" active />
          <NavLink href="/dashboard/settings" label="Settings" />
          <NavLink href="/pricing" label="Pricing" />
          <NavLink href="/dashboard/manual-queue" label="Manual queue" />
          <NavLink href="/request-access" label="Request access" />
        </nav>

        <div className="mt-6 cl-muted-box text-xs">
          <p className="cl-kicker">{props.creditSummary.planLabel} plan</p>
          <p className="mt-2 text-slate-700">Chat messages are free.</p>
          <p className="mt-1.5 text-slate-700">
            Generation credits: <strong>{creditSummary.generationRemaining}</strong> / {creditSummary.generationLimit}
          </p>
          <p className="mt-1 text-slate-700">
            Render credits: <strong>{creditSummary.renderRemaining}</strong> / {creditSummary.renderLimit}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="cl-kicker">Chats</h2>
          <Button type="button" className="h-8 px-3 text-xs" onClick={createConversation}>
            New
          </Button>
        </div>
        <div className="mt-2 space-y-1.5">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                conversation.id === activeConversationId
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
              onClick={() => selectConversation(conversation.id)}
            >
              <p className="line-clamp-2 font-medium">{conversation.title}</p>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3.5 cl-divider md:px-6">
          <button
            type="button"
            className="rounded-lg border px-3 py-1.5 text-sm text-slate-700 transition cl-divider md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            Menu
          </button>
          <div className="min-w-0">
            <p className="cl-kicker">ClipLoop Operator</p>
            <h1 className="truncate text-base font-semibold tracking-tight">{activeConversation?.title ?? "Chat workspace"}</h1>
          </div>
          <Link href="/pricing" className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-700 transition cl-divider hover:bg-slate-50">
            Upgrade to Pro
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-44 md:px-8">
          <div className="mx-auto w-full max-w-3xl space-y-4">
            {messages.length === 0 ? (
              <div className="cl-card p-5 text-sm text-slate-600">
                Ask anything for free, or switch mode below for paid actions. Example: <em>Generate a WhatsApp promo for weekend sale</em>.
              </div>
            ) : null}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl border px-4 py-3.5 text-sm ${
                  message.role === "user"
                    ? "ml-6 border-slate-900 bg-slate-900 text-white"
                    : message.kind === "status"
                      ? "mr-6 bg-slate-50 text-slate-700"
                      : "mr-6 bg-white text-slate-800"
                }`}
              >
                <p className={`mb-1.5 text-[11px] uppercase tracking-[0.14em] ${message.role === "user" ? "text-slate-300" : "text-slate-500"}`}>
                  {message.role === "user" ? "You" : message.kind === "status" ? "Status" : "ClipLoop"}
                </p>
                <p className="leading-6">{message.content}</p>
                {message.kind === "result" ? <ResultCard metadata={message.metadataJson ?? {}} /> : null}
              </div>
            ))}
          </div>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/97 p-3 backdrop-blur cl-divider md:static md:border-t md:bg-white md:p-4">
          <div className="mx-auto w-full max-w-3xl space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              <ModePill active={mode === "chat"} onClick={() => setMode("chat")} label="Ask (Free)" />
              <ModePill active={mode === "generate_copy"} onClick={() => setMode("generate_copy")} label="Generate Copy (1 credit)" />
              <ModePill active={mode === "generate_video"} onClick={() => setMode("generate_video")} label="Generate + Render (2 credits)" />
            </div>
            <div className="flex items-end gap-2">
              <textarea
                className="max-h-40 min-h-12 flex-1 rounded-2xl border bg-white p-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 cl-divider"
                placeholder={
                  mode === "chat"
                    ? "Ask anything about your promo strategy..."
                    : mode === "generate_copy"
                      ? "Describe the promo copy you want..."
                      : "Describe the promo video you want..."
                }
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
              <Button type="button" onClick={sendMessage} disabled={sending || !activeConversationId}>
                {sending ? "Working..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function findWalletFromMessages(messages: Message[]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const metadata = messages[i]?.metadataJson;
    if (!metadata || typeof metadata !== "object") continue;
    const walletAfter = (metadata as Record<string, unknown>).walletAfter;
    if (!walletAfter || typeof walletAfter !== "object") continue;
    const generation = (walletAfter as Record<string, unknown>).generation;
    const render = (walletAfter as Record<string, unknown>).render;
    if (typeof generation === "number" && typeof render === "number") {
      return { generation, render };
    }
  }
  return null;
}

function ModePill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active ? "border-slate-900 bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function NavLink({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <a href={href} className={`cl-nav-item ${active ? "cl-nav-item-active" : ""}`}>
      {label}
    </a>
  );
}

function ResultCard({ metadata }: { metadata: Record<string, unknown> }) {
  const videoUrl = typeof metadata.videoUrl === "string" ? metadata.videoUrl : null;
  const caption = typeof metadata.caption === "string" ? metadata.caption : "";
  const ctaText = typeof metadata.ctaText === "string" ? metadata.ctaText : "";
  const targetChannel = typeof metadata.targetChannel === "string" ? metadata.targetChannel : "";
  const downloadUrl = typeof metadata.downloadUrl === "string" ? metadata.downloadUrl : null;
  const creditsConsumed = typeof metadata.creditsConsumed === "number" ? metadata.creditsConsumed : null;
  const receipts = Array.isArray(metadata.creditReceipts) ? metadata.creditReceipts : [];
  const parsedReceipts = receipts
    .map((receipt) => {
      if (!receipt || typeof receipt !== "object") return null;
      const row = receipt as Record<string, unknown>;
      const transactionId = typeof row.transactionId === "string" ? row.transactionId : null;
      const bucket = typeof row.bucket === "string" ? row.bucket : null;
      const amount = typeof row.amount === "number" ? row.amount : null;
      const reason = typeof row.reason === "string" ? row.reason : null;
      const createdAtRaw = typeof row.createdAt === "string" ? row.createdAt : null;
      if (!transactionId || !bucket || !amount || !reason || !createdAtRaw) return null;
      const createdAt = new Date(createdAtRaw);
      return {
        transactionId,
        bucket,
        amount,
        reason,
        time: Number.isNaN(createdAt.getTime()) ? createdAtRaw : `${createdAt.toISOString().replace("T", " ").slice(0, 16)} UTC`,
      };
    })
    .filter(Boolean) as Array<{
    transactionId: string;
    bucket: string;
    amount: number;
    reason: string;
    time: string;
  }>;

  return (
    <div className="mt-3 space-y-2 rounded-xl border p-3 text-slate-800 cl-divider" style={{ background: "var(--cl-soft)" }}>
      {videoUrl ? (
        <video src={videoUrl} controls className="w-full rounded-lg border bg-black cl-divider" />
      ) : (
        <div className="rounded-lg border bg-white p-2 text-xs text-slate-500 cl-divider">Copy generated. No render preview for this action.</div>
      )}
      <div className="grid gap-1 text-xs text-slate-700">
        <p>
          <strong>Channel:</strong> {targetChannel || "n/a"}
        </p>
        <p>
          <strong>Caption:</strong> {caption || "n/a"}
        </p>
        <p>
          <strong>CTA:</strong> {ctaText || "n/a"}
        </p>
        {creditsConsumed ? (
          <p>
            <strong>Credits used:</strong> {creditsConsumed}
          </p>
        ) : null}
        {parsedReceipts.length > 0 ? (
          <div>
            <p>
              <strong>Charge receipts:</strong>
            </p>
            {parsedReceipts.map((receipt) => (
              <p key={receipt.transactionId} className="mt-0.5 text-slate-700">
                {receipt.amount} {receipt.bucket} credit{receipt.amount === 1 ? "" : "s"} at {receipt.time} ({receipt.reason})
              </p>
            ))}
          </div>
        ) : null}
      </div>
      {downloadUrl ? (
        <a href={downloadUrl} className="inline-flex rounded-lg border bg-white px-2.5 py-1 text-xs font-medium transition cl-divider hover:bg-slate-50">
          Download video
        </a>
      ) : null}
      <a href="/dashboard/settings" className="inline-flex rounded-lg border bg-white px-2.5 py-1 text-xs font-medium transition cl-divider hover:bg-slate-50">
        View credit history
      </a>
    </div>
  );
}
