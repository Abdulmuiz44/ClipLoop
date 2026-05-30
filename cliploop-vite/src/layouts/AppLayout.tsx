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

// ── SVG Icons ─────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CreateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ChatsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TemplatesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function ApiKeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M17 7H7M17 7V17" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 4l10 10M14 4L4 14" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

// ── Nav Items ─────────────────────────────────────────────────────────

type NavItem = { to: string; label: string; icon: React.ReactNode };

const primaryNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: <HomeIcon /> },
  { to: "/dashboard/create", label: "Create", icon: <CreateIcon /> },
  { to: "/dashboard/projects", label: "Projects", icon: <ProjectsIcon /> },
  { to: "/dashboard/chats", label: "Chats", icon: <ChatsIcon /> },
  { to: "/dashboard/weekly-promo", label: "Templates", icon: <TemplatesIcon /> },
  { to: "/dashboard/settings/api-keys", label: "API Keys", icon: <ApiKeyIcon /> },
];

const secondaryNav: NavItem[] = [
  { to: "/pricing", label: "Billing", icon: <CreditCardIcon /> },
];

// ── Helpers ───────────────────────────────────────────────────────────

function getInitials(nameOrEmail: string | undefined): string {
  if (!nameOrEmail) return "?";
  const name = nameOrEmail.trim();
  const parts = name.split(/[\s@]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Helper to close sidebar and navigate
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

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
      // Proceed even if fetch fails
    }
    navigate("/signin", { replace: true });
  }, [navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="text-sm text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const initials = getInitials(user.name || user.email);
  const displayName = user.name || user.email.split("@")[0];

  function isActive(path: string) {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  }

  function renderNavLink(item: NavItem) {
    const active = isActive(item.to);
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={closeSidebar}
        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
          active
            ? "bg-white/[0.06] text-white"
            : "text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200"
        }`}
      >
        {/* Active indicator */}
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-white" />
        )}
        <span className={`flex-shrink-0 ${active ? "text-white" : "text-neutral-500 group-hover:text-neutral-300"}`}>
          {item.icon}
        </span>
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.06] bg-[#0A0A0A] transition-transform duration-200 md:w-60 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo + close */}
        <div className="flex h-14 items-center justify-between border-b border-white/[0.06] px-4">
          <ClipLoopLogo href="/dashboard" light />
          <button
            className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 hover:bg-white/[0.06] hover:text-white md:hidden"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Primary Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {primaryNav.map(renderNavLink)}
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-white/[0.06]" />

          {/* Secondary Nav */}
          <div className="space-y-0.5">
            {secondaryNav.map(renderNavLink)}
          </div>
        </nav>

        {/* Footer: external links + user */}
        <div className="border-t border-white/[0.06] px-3 py-3">
          {/* External links */}
          <div className="mb-3 space-y-0.5">
            <a
              href="https://github.com/talocode/cliploop/blob/main/docs/PUBLIC_API.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-500 transition hover:bg-white/[0.04] hover:text-neutral-200"
            >
              <span className="flex-shrink-0 opacity-50"><GitHubIcon /></span>
              <span>API Docs</span>
              <span className="ml-auto opacity-40"><ExternalIcon /></span>
            </a>
          </div>

          {/* Upgrade card */}
          <div className="mb-3 rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-3.5">
            <p className="text-sm font-semibold text-white">Upgrade to Pro</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              More credits, premium templates & advanced features.
            </p>
            <Link
              to="/pricing"
              onClick={closeSidebar}
              className="mt-2.5 inline-flex h-8 items-center justify-center rounded-lg bg-white px-3 text-xs font-semibold text-black transition hover:bg-neutral-200"
            >
              Upgrade Now
            </Link>
          </div>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-white/[0.04]"
            >
              {user.image ? (
                <img src={user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold text-white">
                  {initials}
                </span>
              )}
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="truncate text-xs text-neutral-500">{user.email}</p>
              </div>
              <span className={`flex-shrink-0 text-neutral-500 transition-transform duration-150 ${menuOpen ? "rotate-180" : ""}`}>
                <ChevronDownIcon />
              </span>
            </button>

            {menuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0F0F0F] shadow-2xl">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-neutral-400 transition hover:bg-white/[0.04] hover:text-red-400"
                >
                  <LogOutIcon />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="min-w-0 md:ml-60">
        {/* Top bar (mobile only) */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/[0.06] bg-[#050505]/80 px-4 backdrop-blur-lg md:hidden">
          <button
            className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-white/[0.06] hover:text-white"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <MenuIcon />
          </button>
          <ClipLoopLogo href="/dashboard" light />
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="p-4 md:p-6 lg:p-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
