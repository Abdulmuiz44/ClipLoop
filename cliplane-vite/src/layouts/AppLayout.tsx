import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { ClipLaneLogo } from "@/components/ui/ClipLaneLogo";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = import.meta.env.DEV ? "/api" : "https://app.cliplane.site/api";

type SessionUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

// ── SVG Icons (Lucide-style, 18px, tailored) ──

function Svg({ d, viewBox = "0 0 24 24", w = 18 }: { d: string; viewBox?: string; w?: number }) {
  return <svg width={w} height={w} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />;
}
const Hi = () => <Svg d='<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' />;
const Pi = () => <Svg d='<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>' />;
const Fi = () => <Svg d='<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>' />;
const Ci = () => <Svg d='<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' />;
const Gi = () => <Svg d='<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' />;
const Ki = () => <Svg d='<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>' />;
const Bi = () => <Svg d='<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>' />;
const Si = () => <Svg d='<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>' />;
const Mi = () => <Svg d='<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>' />;
const Xi = () => <Svg d='<path d="M18 6L6 18M6 6l12 12"/>' />;
const Vi = () => <Svg d='<polyline points="6 9 12 15 18 9"/>' />;
const Li = () => <Svg d='<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>' />;
const Ei = () => <Svg d='<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>' w={14} />

// ── Nav items ──

type NavItem = { to: string; label: string; icon: React.ReactNode };

const mainNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: <Hi /> },
  { to: "/dashboard/create", label: "Create", icon: <Pi /> },
  { to: "/dashboard/projects", label: "Projects", icon: <Fi /> },
  { to: "/dashboard/chats", label: "Chats", icon: <Ci /> },
  { to: "/dashboard/weekly-promo", label: "Templates", icon: <Gi /> },
  { to: "/dashboard/settings/api-keys", label: "API Keys", icon: <Ki /> },
];

const secondaryNav: NavItem[] = [
  { to: "/dashboard/billing", label: "Billing", icon: <Bi /> },
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

  function NavLink({ item, iconOnly = false }: { item: NavItem; iconOnly?: boolean }) {
    const a = active(item.to);
    const base = "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150";
    const activeStyle = a
      ? "relative bg-neutral-800 text-white before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-[3px] before:rounded-r-md before:bg-white"
      : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200";
    return (
      <Link
        to={item.to}
        onClick={close}
        className={`${base} ${activeStyle}`}
      >
        <span className={`flex-shrink-0 ${a ? "text-white" : "text-neutral-500 group-hover:text-neutral-300"}`}>
          {item.icon}
        </span>
        {!iconOnly && <span className="font-medium">{item.label}</span>}
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
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-neutral-800 bg-[#050505] transition-transform duration-200 md:relative md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="flex h-12 items-center justify-between border-b border-neutral-800 px-4">
          <ClipLaneLogo href="/dashboard" light />
          <button className="grid h-7 w-7 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-800 hover:text-white md:hidden" onClick={close}><Xi /></button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-0.5">
            {mainNav.map((item) => <NavLink key={item.to} item={item} />)}
          </div>
          <div className="my-3 border-t border-neutral-800/60" />
          <div className="space-y-0.5">
            {secondaryNav.map((item) => <NavLink key={item.to} item={item} />)}
          </div>
          <div className="my-3 border-t border-neutral-800/60" />
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-600">Resources</p>
          <a
            href="https://github.com/talocode/cliplane/blob/main/docs/PUBLIC_API.md"
            target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-400 transition hover:bg-neutral-800/50 hover:text-neutral-200"
          >
            <span className="flex-shrink-0 text-neutral-500 group-hover:text-neutral-300"><Ei /></span>
            <span>API Docs</span>
          </a>
        </nav>

        {/* Footer */}
        <div className="border-t border-neutral-800 px-2 py-2.5">
          {/* Upgrade card */}
          <Link to="/dashboard/billing" onClick={close} className="mb-2 block rounded-xl border border-neutral-800 bg-neutral-900/50 p-2.5 transition hover:border-neutral-700">
            <p className="text-sm font-semibold text-white">Upgrade to Pro</p>
            <p className="mt-0.5 text-xs text-neutral-500">More credits &amp; features</p>
            <span className="mt-1.5 inline-flex h-6 items-center rounded-md bg-white px-2.5 text-[11px] font-semibold text-black">Upgrade</span>
          </Link>

          {/* User */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenu((v) => !v)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-neutral-800/50">
              {user.image ? (
                <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-semibold text-white">{initials}</span>
              )}
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="truncate text-xs text-neutral-500">{user.email}</p>
              </div>
              <span className={`flex-shrink-0 text-neutral-500 transition-transform ${menu ? "rotate-180" : ""}`}><Vi /></span>
            </button>
            {menu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
                <button onClick={signOut} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-neutral-400 transition hover:bg-neutral-800/50 hover:text-red-400">
                  <Li />
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
        <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-neutral-800 bg-[#050505]/80 px-4 backdrop-blur-lg md:hidden">
          <button className="grid h-7 w-7 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-800" onClick={() => setOpen(true)}><Mi /></button>
          <ClipLaneLogo href="/dashboard" light />
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
