"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import { ClipLoopLogo } from "@/components/ui/cliploop-logo";
import { signOutUser } from "@/lib/auth/actions";

type NavItem = { href: string; label: string };

const primaryNav: NavItem[] = [
  { href: "/app", label: "Overview" },
  { href: "/app/projects", label: "Projects" },
  { href: "/app/chats", label: "Chats" },
  { href: "/app/create", label: "Create" },
  { href: "/dashboard/business", label: "Business" },
  { href: "/dashboard/manual-queue", label: "Queue" },
  { href: "/dashboard/settings", label: "Settings" },
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
    <div className="relative -mx-4 min-h-[calc(100vh-5rem)] bg-slate-50 md:mx-0 md:overflow-hidden md:rounded-xl md:border md:border-slate-200">
      {sidebarOpen ? <button className="fixed inset-0 z-30 bg-slate-900/30 md:hidden" onClick={() => setSidebarOpen(false)} /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white p-4 transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ClipLoopLogo href="/app" />

        <Link
          href="/app/create"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
          onClick={() => setSidebarOpen(false)}
        >
          New Creation
        </Link>

        <nav className="mt-5 space-y-1">
          {primaryNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`cl-nav-item ${active ? "cl-nav-item-active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <Link href="/pricing" className="cl-card block rounded-lg p-3 text-sm text-slate-700 transition hover:border-blue-300">
            <p className="font-semibold text-slate-900">Upgrade to Pro</p>
            <p className="mt-1 text-xs text-slate-500">Higher generation and rendering limits.</p>
          </Link>

          <div className="cl-card flex items-center gap-3 rounded-lg p-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-xs font-semibold text-white">{initials}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{userName || userEmail || "ClipLoop Studio"}</p>
              <p className="truncate text-xs text-slate-500">{userEmail || "Workspace user"}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 bg-slate-50">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3.5 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 md:hidden" onClick={() => setSidebarOpen(true)}>
              Menu
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>
              {subtitle ? <p className="truncate text-sm text-slate-600">{subtitle}</p> : null}
            </div>

            <form action={signOutUser} className="ml-auto">
              <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="p-4 md:p-6">
          {children}
          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
            <p>ClipLoop</p>
            <div className="flex items-center gap-5">
              <span>Terms</span>
              <span>Privacy</span>
              <span>Support</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
