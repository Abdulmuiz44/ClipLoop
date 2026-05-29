import { Outlet, Link, useLocation } from "react-router-dom";
import { ClipLoopLogo } from "@/components/ui/ClipLoopLogo";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";

type NavItem = { to: string; label: string; icon: string };

const navItems: NavItem[] = [
  { to: "/app", label: "Home", icon: "🏠" },
  { to: "/app/create", label: "Create", icon: "✨" },
  { to: "/app/projects", label: "Projects", icon: "📁" },
  { to: "/app/chats", label: "Chats", icon: "💬" },
  { to: "/app/weekly-promo", label: "Templates", icon: "📋" },
  { to: "/app/settings/api-keys", label: "API Keys", icon: "🔑" },
];

export function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = useMemo(() => "CL", []);

  // Override: for the app layout, we render the dark sidebar + light content area
  return (
    <div className="relative min-h-screen bg-[#050505] bg-[#050505]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#05070d] p-4 text-white transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ClipLoopLogo href="/app" light />

        <Link
          to="/app/create"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0E0E0E] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F1F1F]"
          onClick={() => setSidebarOpen(false)}
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-[#1F1F1F] bg-[#0E0E0E] text-white">
            +
          </span>
          Create New
          <span className="ml-1 text-[#8B8B8B]">✦</span>
        </Link>

        <nav className="mt-5 space-y-1.5">
          {navItems.map((item) => {
            const active =
              location.pathname === item.to ||
              location.pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  active
                    ? "bg-[#0d1423] text-white shadow-[inset_3px_0_0_#22c55e]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-white/90">
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <Link
            to="/pricing"
            className="block rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-4 text-sm text-slate-300 shadow-sm transition hover:border-emerald-500"
          >
            <p className="font-semibold text-white">Upgrade to Pro</p>
            <p className="mt-1 text-xs text-[#8B8B8B]">
              Unlock more credits, premium templates & advanced features.
            </p>
            <p className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white">
              Upgrade Now
            </p>
          </Link>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#0E0E0E] p-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#111111] text-xs font-semibold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                ClipLoop Studio
              </p>
              <p className="truncate text-xs text-[#8B8B8B]">Workspace</p>
            </div>
            <span className="text-[#8B8B8B]">▾</span>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="min-w-0 bg-[#050505] bg-[#050505] md:ml-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-[#1F1F1F] bg-[#0E0E0E]/95 px-4 py-3 backdrop-blur border-[#1F1F1F] bg-[#050505]/90">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md border border-[#1F1F1F] bg-[#0E0E0E] px-3 py-1.5 text-sm text-slate-300 md:hidden border-[#1F1F1F] bg-[#0E0E0E] text-slate-300"
              onClick={() => setSidebarOpen(true)}
            >
              Menu
            </button>
            <input
              aria-label="Search"
              placeholder="Search projects, content, templates..."
              className="w-full max-w-[520px] rounded-2xl border border-[#1F1F1F] bg-[#111111] py-2.5 pl-4 pr-4 text-sm text-slate-300 outline-none focus:border-emerald-500 border-[#1F1F1F] bg-[#0E0E0E] text-slate-200"
            />
          </div>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="p-4 md:p-6"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
