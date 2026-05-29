import { Outlet, Link } from "react-router-dom";
import { ClipLoopLogo } from "@/components/ui/ClipLoopLogo";
import { motion } from "framer-motion";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/pricing", label: "Pricing" },
];

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#050505] bg-[#050505]">
      {/* Animated header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-40 border-b border-[#1F1F1F] bg-[#050505]/95 backdrop-blur-sm border-[#1F1F1F] bg-[#050505]/95"
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:py-4">
          <ClipLoopLogo href="/" />
          <div className="flex items-center gap-1 text-sm text-slate-300 text-slate-300">
            <Link
              to="/app"
              className="rounded-md px-3 py-1.5 transition hover:bg-[#1F1F1F] hover:text-white hover:bg-[#1F1F1F] hover:text-white"
            >
              Open App
            </Link>
            <Link
              to="/pricing"
              className="rounded-md px-3 py-1.5 transition hover:bg-[#1F1F1F] hover:text-white hover:bg-[#1F1F1F] hover:text-white"
            >
              Pricing
            </Link>
            <Link
              to="/signin"
              className="rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white transition hover:bg-emerald-500 bg-emerald-600 "
            >
              Sign in
            </Link>
          </div>
        </nav>
      </motion.header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <Outlet />
      </main>

      <footer className="mx-auto mt-4 flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-[#1F1F1F] px-4 py-4 text-xs text-[#8B8B8B] border-[#1F1F1F] text-[#8B8B8B]">
        <ClipLoopLogo href="/" compact />
        <div className="flex items-center gap-4">
          <Link to="/pricing">Pricing</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/support">Support</Link>
        </div>
      </footer>
    </div>
  );
}
