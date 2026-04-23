"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import cliploopLogo from "../../../assets/cliploop_logo.png";

type NavItem = { href: string; label: string; icon: string };

const primaryNav: NavItem[] = [
  { href: "/app", label: "Home", icon: "H" },
  { href: "/app/projects", label: "Projects", icon: "P" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "A" },
  { href: "/dashboard/manual-queue", label: "Manual Queue", icon: "M" },
  { href: "/dashboard/brand-kit", label: "Brand Kit", icon: "B" },
  { href: "/dashboard/templates", label: "Templates", icon: "T" },
  { href: "/dashboard/inspiration", label: "Inspiration", icon: "I" },
  { href: "/dashboard/settings", label: "Settings", icon: "S" },
];

export function StudioShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeLabel = useMemo(
    () => primaryNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ?? "Home",
    [pathname],
  );

  return (
    <div className="relative -mx-4 min-h-[calc(100vh-5rem)] bg-[#f3f4f6] md:mx-0 md:overflow-hidden md:rounded-3xl md:border md:border-[#dfe2e7]">
      {sidebarOpen ? <button className="fixed inset-0 z-30 bg-black/35 md:hidden" onClick={() => setSidebarOpen(false)} /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col bg-[#020813] p-4 text-white transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/app" className="inline-flex items-center gap-3 px-2 py-1">
          <span className="relative h-10 w-36 overflow-hidden rounded-md">
            <Image src={cliploopLogo} alt="ClipLoop" fill sizes="144px" className="object-contain object-left" priority />
          </span>
        </Link>

        <Link
          href="/app/create"
          className="mt-5 flex h-14 items-center justify-center rounded-2xl bg-white text-base font-semibold text-[#131820]"
          onClick={() => setSidebarOpen(false)}
        >
          +&nbsp; Create New
        </Link>

        <nav className="mt-4 space-y-1.5">
          {primaryNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
                  active ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/5"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center text-xs text-white/85">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-emerald-900/60 bg-[#07151d] p-4">
            <p className="text-sm font-semibold text-emerald-300">Upgrade to Pro</p>
            <p className="mt-1 text-xs leading-5 text-emerald-100/75">Unlock more credits, premium templates and advanced features.</p>
            <Link
              href="/pricing"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-[#23d57a] px-4 text-sm font-semibold text-[#052110]"
            >
              Upgrade Now
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#060d18] px-3 py-2.5">
            <div className="flex items-center gap-3">
              <span className="relative h-9 w-9 overflow-hidden rounded-full bg-white/10">
                <Image src={cliploopLogo} alt="ClipLoop workspace" fill sizes="36px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">ClipLoop Studio</p>
                <p className="text-xs text-white/65">Workspace</p>
              </div>
              <span className="text-xs text-white/70">v</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-[#e4e7ec] bg-[#f3f4f6]/95 px-4 py-3.5 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-[#d9dce1] bg-white px-3 py-1.5 text-sm md:hidden" onClick={() => setSidebarOpen(true)}>
              Menu
            </button>
            <div className="hidden md:block md:w-[380px] md:max-w-[48vw]">
              <div className="flex h-11 items-center gap-2 rounded-xl border border-[#e1e3e8] bg-white px-3">
                <span className="text-sm text-[#8e95a3]">S</span>
                <input
                  readOnly
                  value="Search projects, content, templates..."
                  className="w-full bg-transparent text-sm text-[#99a1ad] outline-none"
                  aria-label="Search"
                />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <span className="text-lg text-[#313746]">!</span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#20c46b]" />
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#252b39] text-sm font-semibold text-white">JD</span>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-[#161c27]">John Doe</p>
                  <p className="text-xs text-[#798191]">{activeLabel === "Home" ? "Pro Plan" : activeLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <div className="mb-5">
            <h1 className="text-[44px] font-semibold leading-tight tracking-[-0.02em] text-[#161c27] md:text-[46px]">{title}</h1>
            {subtitle ? <p className="mt-1 text-[26px] leading-tight text-[#727b89] md:text-[27px]">{subtitle}</p> : null}
          </div>
          {children}
          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 px-1 pb-1 text-xs text-[#97a0ae]">
            <p>(c) 2025 ClipLoop. All rights reserved.</p>
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
