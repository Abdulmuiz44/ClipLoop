import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ClipLaneLogo } from "@/components/ui/ClipLaneLogo";
import { motion } from "framer-motion";
import { useEffect } from "react";

const API_BASE = import.meta.env.DEV ? "/api" : "https://api.talocode.site/v1/cliplane";

export default function SignInPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const error = searchParams.get("error");

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    fetch(`${API_BASE}/auth/session`, { credentials: "include" })
      .then((r) => r.json())
      .then((session) => {
        if (session?.user) {
          navigate("/dashboard", { replace: true });
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleGoogleSignIn = () => {
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    window.location.href = `${API_BASE}/auth/signin?callbackUrl=${encodeURIComponent(
      "https://dashboard.talocode.site/products/cliplane" + callbackUrl
    )}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md items-center justify-center px-4"
    >
      <section className="w-full rounded-xl border border-[#1F1F1F] bg-[#0E0E0E] p-5 md:p-7">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ClipLaneLogo href="/" />
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Sign in
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#8B8B8B]">
            Use Google to access your ClipLane workspace.
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"
          >
            Google sign-in failed. Check your account access and try again.
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <button
            onClick={handleGoogleSignIn}
            className="flex h-12 w-full items-center justify-center rounded-lg border border-[#1F1F1F] bg-white px-4 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Continue with Google
          </button>
        </motion.div>

        <p className="mt-5 text-center text-sm text-[#8B8B8B]">
          Need beta access?{" "}
          <Link
            to="/request-access"
            className="font-medium text-white hover:underline"
          >
            Request access
          </Link>
        </p>
      </section>
    </motion.div>
  );
}
