import { Outlet, Link } from "react-router-dom";
import { ClipLaneLogo } from "@/components/ui/ClipLaneLogo";
import { motion } from "framer-motion";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/pricing", label: "Pricing" },
];

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Animated header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-40 border-b border-[#1F1F1F] bg-[#050505]/95 backdrop-blur-sm"
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <ClipLaneLogo href="/" />
          <div className="flex items-center gap-1.5 md:gap-2">
            <a
              href="https://dashboard.talocode.site/products/cliplane"
              className="rounded-md px-2.5 py-1.5 text-sm text-slate-300 transition hover:bg-[#1F1F1F] hover:text-white md:px-3"
            >
              Open App
            </a>
            <Link
              to="/pricing"
              className="rounded-md px-2.5 py-1.5 text-sm text-slate-300 transition hover:bg-[#1F1F1F] hover:text-white md:px-3"
            >
              Pricing
            </Link>
            <Link
              to="/signin"
              className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-black transition hover:bg-neutral-200"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </motion.header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>

      <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 border-t border-[#1F1F1F] px-4 py-4 text-xs text-[#8B8B8B] sm:flex-row md:px-6">
        <ClipLaneLogo href="/" compact />
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
