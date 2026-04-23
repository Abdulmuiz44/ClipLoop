"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import { ClipLoopLogo } from "@/components/ui/cliploop-logo";

type NavItem = { href: string; label: string };

const primaryNav: NavItem[] = [
  { href: "/app", label: "Home" },
  { href: "/app/create", label: "Create" },
  { href: "/app/chats", label: "Chats" },
  { href: "/app/projects", label: "Projects" },
  { href: "/dashboard/manual-queue", label: "Manual Queue" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function StudioShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeLabel = useMemo(
    () => primaryNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ?? "Home",
    [pathname],
  );

  return (
    <div className="relative -mx-4 min-h-[calc(100vh-5rem)] bg-[#f5f7fa] md:mx-0 md:rounded-3xl md:border md:cl-divider md:shadow-sm">
      {sidebarOpen ? <button className="fixed inset-0 z-30 bg-black/35 md:hidden" onClick={() => setSidebarOpen(false)} /> : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800 bg-[#070c13] p-4 text-slate-100 transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2"><ClipLoopLogo href="/app" compact /><span className="text-lg font-semibold text-white">ClipLoop</span></div>
          <button className="rounded-lg border border-slate-700 px-2 py-1 text-xs md:hidden" onClick={() => setSidebarOpen(false)}>
            Close
          </button>
        </div>

        <Link
          href="/app/create"
          className="mt-5 flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
          onClick={() => setSidebarOpen(false)}
        >
          + Create New
        </Link>

        <nav className="mt-5 space-y-1">
          {primaryNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3.5 py-2.5 text-sm transition ${
                  active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-2xl border border-emerald-700/40 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-200">Upgrade to Pro</p>
          <p className="mt-1 text-xs text-emerald-100/80">Unlock higher credits, templates, and priority rendering.</p>
          <Link href="/pricing" className="mt-3 inline-flex rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950">
            Upgrade
          </Link>
        </div>
      </aside>

      <div className="md:pl-0">
        <header className="sticky top-0 z-20 border-b bg-white/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-lg border px-3 py-1.5 text-sm md:hidden" onClick={() => setSidebarOpen(true)}>
              Menu
            </button>
            <div className="hidden flex-1 items-center rounded-xl border px-3 py-2 md:flex">
              <input
                readOnly
                value="Search projects, content, templates..."
                className="w-full bg-transparent text-sm text-slate-500 outline-none"
                aria-label="Search"
              />
              <span className="rounded border px-2 py-0.5 text-[11px] text-slate-500">K</span>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm font-semibold text-slate-900">ClipLoop Workspace</p>
              <p className="text-xs text-slate-500">{activeLabel}</p>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
