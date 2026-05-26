"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import { ClipLoopLogo } from "@/components/ui/cliploop-logo";
import { signOutUser } from "@/lib/auth/actions";

type NavItem = { href: string; label: string; icon: ReactNode };

function NavIcon({ children }: { children: ReactNode }) {
  return <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-white/90">{children}</span>;
}

const icons = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-7H10v7H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  spark: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l1.2 5.1L18 9l-4.8 1.9L12 16l-1.2-5.1L6 9l4.8-1.9L12 2Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  folder: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4l2 2h7A2 2 0 0 1 20.5 9.5v9A2 2 0 0 1 18.5 20.5h-13A2 2 0 0 1 3.5 18.5v-11Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 20V10M12 20V4m7 16v-8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  list: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  bag: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7V6a5 5 0 0 1 10 0v1" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6 7h12l-1 14H7L6 7Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  layout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5h16v6H4V5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 13h7v6H4v-6Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M13 13h7v6h-7v-6Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  bulb: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18h6M10 22h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 14a6 6 0 1 1 8 0c-.8.7-1.3 1.6-1.5 2.6H9.5c-.2-1-.7-1.9-1.5-2.6Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M19.4 15a7.96 7.96 0 0 0 .1-1l2-1.5-2-3.5-2.4.8a8.2 8.2 0 0 0-.9-.5L15.8 5h-4l-.4 2.8a8.2 8.2 0 0 0-.9.5L8.1 7.5l-2 3.5L8 12.5a7.96 7.96 0 0 0 0 1L6.1 15l2 3.5 2.4-.8c.3.2.6.4.9.5l.4 2.8h4l.4-2.8c.3-.1.6-.3.9-.5l2.4.8 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const primaryNav: NavItem[] = [
  { href: "/app", label: "Home", icon: <NavIcon>{icons.home}</NavIcon> },
  { href: "/app/create", label: "Create", icon: <NavIcon>{icons.spark}</NavIcon> },
  { href: "/app/projects", label: "Projects", icon: <NavIcon>{icons.folder}</NavIcon> },
  { href: "/dashboard/analytics", label: "Analytics", icon: <NavIcon>{icons.chart}</NavIcon> },
  { href: "/dashboard/manual-queue", label: "Manual Queue", icon: <NavIcon>{icons.list}</NavIcon> },
  { href: "/dashboard/business", label: "Brand Kit", icon: <NavIcon>{icons.bag}</NavIcon> },
  { href: "/app/weekly-promo", label: "Templates", icon: <NavIcon>{icons.layout}</NavIcon> },
  { href: "/app/chats", label: "Inspiration", icon: <NavIcon>{icons.bulb}</NavIcon> },
  { href: "/dashboard/settings", label: "Settings", icon: <NavIcon>{icons.settings}</NavIcon> },
  { href: "/app/settings/api-keys", label: "API Keys", icon: <NavIcon>{icons.settings}</NavIcon> },
];

export function StudioShell({
  children,
  title,
  subtitle,
  userName = "ClipLoop Studio",
  userEmail,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = useMemo(() => {
    const source = userName || userEmail || "ClipLoop Studio";
    const parts = source.split(/[ @.]+/).filter(Boolean);
    return `${parts[0]?.[0] ?? "C"}${parts[1]?.[0] ?? "L"}`.toUpperCase();
  }, [userEmail, userName]);

  return (
    <div className="relative -mx-4 min-h-[calc(100vh-5rem)] bg-[#f6f7fb] md:mx-0 md:overflow-hidden md:rounded-2xl md:border md:border-slate-200 dark:bg-slate-950 dark:border-slate-800">
      {sidebarOpen ? <button className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#05070d] p-4 text-white transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ClipLoopLogo href="/app" textClassName="text-white" />

        <Link
          href="/app/create"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
          onClick={() => setSidebarOpen(false)}
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-900">+</span>
          Create New
          <span className="ml-1 text-slate-500">✦</span>
        </Link>

        <nav className="mt-5 space-y-1.5">
          {primaryNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  active ? "bg-[#0d1423] text-white shadow-[inset_3px_0_0_#22c55e]" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <Link
            href="/pricing"
            className="block rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-4 text-sm text-slate-300 shadow-sm transition hover:border-emerald-500"
          >
            <p className="font-semibold text-white">Upgrade to Pro</p>
            <p className="mt-1 text-xs text-slate-400">Unlock more credits, premium templates as advanced features.</p>
            <p className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white">Upgrade Now</p>
          </Link>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">CL</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">ClipLoop Studio</p>
              <p className="truncate text-xs text-slate-400">Workspace</p>
            </div>
            <span className="text-slate-400">▾</span>
          </div>
        </div>
      </aside>

      <div className="min-w-0 bg-[#f6f7fb] dark:bg-slate-950">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6 dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex items-center gap-3">
            <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 md:hidden" onClick={() => setSidebarOpen(true)}>
              Menu
            </button>

            <div className="hidden flex-1 justify-center md:flex">
              <div className="relative w-full max-w-[520px]">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M16.2 16.2 21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  aria-label="Search"
                  placeholder="Search projects, content, templates..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-12 text-sm text-slate-700 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-950">
                  ⌘ K
                </span>
              </div>
            </div>

            <div className="min-w-0 md:hidden">
              <h1 className="truncate text-base font-semibold text-slate-900 dark:text-white">{title}</h1>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                aria-label="Notifications"
                className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm md:flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
              </button>

              <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1 shadow-sm md:flex dark:border-slate-700 dark:bg-slate-900">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">{initials}</span>
                <div className="pr-1 leading-tight">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{userName?.split(" ")[0] ?? "John"}</p>
                  <p className="text-[11px] text-slate-500">Pro Plan</p>
                </div>
                <span className="pr-1 text-slate-500">▾</span>
              </div>

              {/* keep sign out available but not visible in the polished header */}
              <form action={signOutUser} className="hidden">
                <button className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  Sign out
                </button>
              </form>
            </div>
          </div>
          {subtitle ? <p className="mt-2 hidden text-sm text-slate-500 md:block">{subtitle}</p> : null}
        </header>

        <main className="p-4 md:p-6">
          {children}
          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800">
            <p>© 2026 ClipLoop. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/support">Support</Link>
            </div>
          </footer>

          <button
            aria-label="Help"
            className="fixed bottom-6 right-6 grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            ?
          </button>
        </main>
      </div>
    </div>
  );
}
