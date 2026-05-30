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

// ── SVG Icons ──

function Icon({ path, viewBox = "0 0 24 24" }: { path: string; viewBox?: string }) {
  return (
    <svg width="18" height="18" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

function HomeIcn() { return <Icon path='<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' />; }
function PlusIcn() { return <Icon path='<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>' />; }
function FolderIcn() { return <Icon path='<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>' />; }
function ChatIcn() { return <Icon path='<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' />; }
function GridIcn() { return <Icon path='<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' />; }
function KeyIcn() { return <Icon path='<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>' />; }
function BillingIcn() { return <Icon path='<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>' />; }
function SettingsIcn() { return <Icon path='<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>' />; }
function BookIcn() { return <Icon path='<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' />; }
function MenuIcn() { return <Icon path='<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>' />; }
function CloseIcn() { return <Icon path='<path d="M18 6L6 18M6 6l12 12"/>' />; }
function ChevronIcn() { return <Icon path='<polyline points="6 9 12 15 18 9"/>' />; }
function LogoutIcn() { return <Icon path='<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>' />; }
function ExternalIcn() { return <Icon path='<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>' viewBox="0 0 24 24" />; }

// ── Nav items ──

type NavItem = { to: string; label: string; icon: React.ReactNode };

const mainNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: <HomeIcn /> },
  { to: "/dashboard/create", label: "Create", icon: <PlusIcn /> },
  { to: "/dashboard/projects", label: "Projects", icon: <FolderIcn /> },
  { to: "/dashboard/chats", label: "Chats", icon: <ChatIcn /> },
  { to: "/dashboard/weekly-promo", label: "Templates", icon: <GridIcn /> },
  { to: "/dashboard/settings/api-keys", label: "API Keys", icon: <KeyIcn /> },
];

const secondaryNav: NavItem[] = [
  { to: "/pricing", label: "Billing", icon: <BillingIcn /> },
];

// ── Helpers ──

function getInitials(nameOrEmail: string | undefined): string {
  if (!nameOrEmail) return "?";
  const n = nameOrEmail.trim();
  const parts = n.split(/[\s@]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

// ── Component ──

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    fetch(`${API_BASE}/auth/session`, { credentials: "include" })
      .then((r) => { if (!r.ok) throw Error(); return r.json(); })
      .then((s) => { if (s?.user) setUser(s.user); else navigate("/signin", { replace: true }); })
      .catch(() => navigate("/signin", { replace: true }))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (!menu) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menu]);

  const signOut = useCallback(async () => {
    setMenu(false);
    try { await fetch(`${API_BASE}/auth/signout`, { method: "POST", credentials: "include" }); } catch {}
    navigate("/signin", { replace: true });
  }, [navigate]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
      <div className="text-sm text-neutral-500">Loading...</div>
    </div>
  );
  if (!user) return null;

  const initials = getInitials(user.name || user.email);
  const displayName = user.name || user.email.split("@")[0];

  function active(p: string) {
    return p === "/dashboard" ? location.pathname === p : location.pathname.startsWith(p);
  }

  function NavLink({ item }: { item: NavItem }) {
    const a = active(item.to);
    return (
      <Link
        to={item.to}
        onClick={close}
        className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
          a
            ? "bg-neutral-800 text-white"
            : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
        }`}
      >
        <span className={`flex-shrink-0 ${a ? "text-white" : "text-neutral-500 group-hover:text-neutral-300"}`}>
          {item.icon}
        </span>
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      {/* Mobile overlay */}
      {open && (
        <button className="fixed inset-0 z-30 bg-black/70 md:hidden" onClick={close} aria-label="Close" />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-neutral-800 bg-[#0A0A0A] transition-transform duration-200 md:relative md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-neutral-800 px-4">
          <ClipLoopLogo href="/dashboard" light />
          <button className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-800 hover:text-white md:hidden" onClick={close}>
            <CloseIcn />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {mainNav.map((item) => <NavLink key={item.to} item={item} />)}
          </div>
          <div className="my-3 border-t border-neutral-800" />
          <div className="space-y-0.5">
            {secondaryNav.map((item) => <NavLink key={item.to} item={item} />)}
          </div>

          {/* Spacer */}
          <div className="my-3 border-t border-neutral-800" />

          {/* Resources */}
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-600">Resources</p>
          <a
            href="https://github.com/talocode/cliploop/blob/main/docs/PUBLIC_API.md"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400 transition hover:bg-neutral-800/50 hover:text-neutral-200"
          >
            <span className="flex-shrink-0 text-neutral-500 group-hover:text-neutral-300"><BookIcn /></span>
            <span>API Docs</span>
            <span className="ml-auto text-neutral-600"><ExternalIcn /></span>
          </a>
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-800 px-3 py-3">
          {/* Upgrade card */}
          <Link to="/pricing" onClick={close} className="mb-3 block rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 transition hover:border-neutral-700">
            <p className="text-sm font-semibold text-white">Upgrade to Pro</p>
            <p className="mt-0.5 text-xs text-neutral-500">More credits &amp; features</p>
            <span className="mt-2 inline-flex h-7 items-center rounded-md bg-white px-2.5 text-xs font-semibold text-black">Upgrade</span>
          </Link>

          {/* User */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenu((v) => !v)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-neutral-800/50">
              {user.image ? (
                <img src={user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold text-white">{initials}</span>
              )}
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="truncate text-xs text-neutral-500">{user.email}</p>
              </div>
              <span className={`flex-shrink-0 text-neutral-500 transition-transform ${menu ? "rotate-180" : ""}`}>
                <ChevronIcn />
              </span>
            </button>
            {menu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
                <button onClick={signOut} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-neutral-400 transition hover:bg-neutral-800/50 hover:text-red-400">
                  <LogoutIcn />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-neutral-800 bg-[#0A0A0A]/80 px-4 backdrop-blur-lg md:hidden">
          <button className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-800" onClick={() => setOpen(true)}>
            <MenuIcn />
          </button>
          <ClipLoopLogo href="/dashboard" light />
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex-1 p-4 md:p-6 lg:p-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
