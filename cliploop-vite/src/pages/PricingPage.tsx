import { Link } from "react-router-dom";
import { ClipLoopLogo } from "@/components/ui/ClipLoopLogo";
import { motion } from "framer-motion";

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 leading-6 text-slate-300 text-slate-300">
      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-600 flex-none" />
      {children}
    </li>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function PricingPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 md:space-y-8"
    >
      {/* Header */}
      <motion.section
        variants={itemVariants}
        className="cl-card p-6 md:p-8"
      >
        <ClipLoopLogo href="/" />
        <p className="cl-kicker mt-4">Pricing</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl text-white">
          Free chat. Pay for{" "}
          <span className="gradient-text">generation and render</span> capacity.
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[#8B8B8B] text-[#8B8B8B]">
          ClipLoop chat stays free. Credits are consumed when you run promo copy
          generation and video rendering operations.
        </p>
      </motion.section>

      {/* Plans */}
      <section className="grid gap-5 md:grid-cols-2">
        {/* Free plan */}
        <motion.article
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="cl-card p-6"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#8B8B8B] text-[#8B8B8B]">
            Free
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white text-white">
            $0
            <span className="text-base font-medium text-[#8B8B8B] text-[#8B8B8B]">
              /month
            </span>
          </h2>
          <p className="mt-4 text-sm text-[#8B8B8B] text-[#8B8B8B]">
            Best for testing ClipLoop with one business profile and light
            monthly output.
          </p>
          <ul className="mt-5 space-y-3 text-sm">
            <Feature>Unlimited chat messages</Feature>
            <Feature>1 active project</Feature>
            <Feature>12 generation credits/month</Feature>
            <Feature>6 render credits/month</Feature>
            <Feature>Manual queue and export workflow included</Feature>
          </ul>
          <div className="mt-6">
            <Link to="/app" className="cl-btn-ghost inline-flex">
              Start in workspace
            </Link>
          </div>
        </motion.article>

        {/* Pro plan */}
        <motion.article
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="cl-card relative overflow-hidden p-6"
        >
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent pointer-events-none"
          />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#8B8B8B] text-[#8B8B8B]">
                  Pro
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white text-white">
                  $5
                  <span className="text-base font-medium text-[#8B8B8B] text-[#8B8B8B]">
                    /month
                  </span>
                </h2>
              </div>
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white"
              >
                Best value
              </motion.span>
            </div>

            <p className="mt-4 text-sm text-[#8B8B8B] text-[#8B8B8B]">
              For operators who need higher generation/render throughput and
              multiple active projects.
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              <Feature>Unlimited chat messages</Feature>
              <Feature>Up to 5 active projects</Feature>
              <Feature>80 generation credits/month</Feature>
              <Feature>40 render credits/month</Feature>
              <Feature>Priority credit envelope for weekly campaigns</Feature>
            </ul>

            <div className="mt-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/signin"
                  className="inline-flex rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500/150 glow-green-sm"
                >
                  Start Pro checkout
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.article>
      </section>
    </motion.div>
  );
}
