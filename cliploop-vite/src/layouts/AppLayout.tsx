import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { ClipLoopLogo } from "@/components/ui/ClipLoopLogo";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = import.meta.env.DEV ? "/api" : "https://app.cliploop.site/api";

type SessionUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

type NavItem = { to: string; label: string; icon: string };

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: "🏠" },
  { to: "/dashboard/create", label: "Create", icon: "✨" },
  { to: "/dashboard/projects", label: "Projects", icon: "📁" },
  { to: "/dashboard/chats", label: "Chats", icon: "💬" },
  { to: "/dashboard/weekly-promo", label: "Templates", icon: "📋" },
  { to: "/dashboard/settings/api-keys", label: "API Keys", icon: "🔑" },
];

function getInitials(nameOrEmail: string | undefined): string {
  if (!nameOrEmail) return "?";
  const name = nameOrEmail.trim();
  const parts = name.split(/[\s@]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch session on mount
  useEffect(() => {
    fetch(`${API_BASE}/auth/session`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          navigate("/signin", { replace: true });
          return;
        }
      })
      .catch(() => {
        navigate("/signin", { replace: true });
      })
      .finally(() => setAuthLoading(false));
  }, [navigate]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleSignOut = useCallback(async () => {
    setMenuOpen(false);
    try {
      await fetch(`${API_BASE}/auth/signout`, { method: "POST", credentials: "include" });
    } catch {
      // Proceed even if fetch fails — cookie clear is best-effort
    }
    navigate("/signin", { replace: true });
  }, [navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="text-sm text-[#8B8B8B]">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const initials = getInitials(user.name || user.email);
  const displayName = user.name || user.email.split("@")[0];

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#05070d] p-4 text-white transition-transform duration-200 md:w-72 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <ClipLoopLogo href="/dashboard" light />
          <button
            className="grid h-8 w-8 place-items-center rounded-lg text-[#8B8B8B] hover:bg-[#0E0E0E] hover:text-white md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l10 10M14 4L4 14" />
            </svg>
          </button>
        </div>

        <Link
          to="/dashboard/create"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0E0E0E] px-4 text-sm font-semibold text-white transition hover:bg-[#1F1F1F]"
          onClick={() => setSidebarOpen(false)}
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-[#1F1F1F] bg-[#0E0E0E] text-white">+</span>
          Create New
          <span className="text-[#8B8B8B]">✦</span>
        </Link>

        <nav className="mt-5 space-y-1 overflow-y-auto">
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
                    ? "bg-[#0d1423] text-white shadow-[inset_3px_0_0_#ffffff]"
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
          {/* External docs link */}
          <a
            href="https://github.com/talocode/cliploop/blob/main/docs/PUBLIC_API.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-white/90">📄</span>
            <span className="font-medium">API Docs</span>
            <svg className="ml-auto h-3 w-3 text-[#8B8B8B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>
        </nav>

        <div className="mt-auto space-y-3 pt-4">
          <Link
            to="/pricing"
            className="block rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 text-sm text-slate-300 transition hover:border-white"
          >
            <p className="font-semibold text-white">Upgrade to Pro</p>
            <p className="mt-1 text-xs text-[#8B8B8B]">
              Unlock more credits, premium templates & advanced features.
            </p>
            <p className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-white px-4 text-xs font-semibold text-black">
              Upgrade Now
            </p>
          </Link>

          {/* User avatar with dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-[#0E0E0E] p-3 text-left transition hover:border-white"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#111111] text-xs font-semibold text-white">
                  {initials}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {displayName}
                </p>
                <p className="truncate text-xs text-[#8B8B8B]">{user.email}</p>
              </div>
              <span className={`text-[#8B8B8B] transition-transform ${menuOpen ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>

            {menuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-slate-800 bg-[#0E0E0E] p-2 shadow-xl">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-400 transition hover:bg-white/5"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 md:ml-72">
        <header className="sticky top-0 z-20 border-b border-[#1F1F1F] bg-[#050505]/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#1F1F1F] bg-[#0E0E0E] text-slate-300 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 4h14M2 9h14M2 14h14" />
              </svg>
            </button>
            <input
              aria-label="Search"
              placeholder="Search projects, content, templates..."
              className="w-full max-w-[520px] rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] py-2.5 pl-4 pr-4 text-sm text-slate-200 outline-none transition focus:border-white"
            />
          </div>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="p-4 md:p-6 lg:p-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
