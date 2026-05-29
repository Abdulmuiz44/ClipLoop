import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const pillars = [
  {
    title: "Plan with context",
    body: "ClipLoop ingests your website and business profile, then assembles reusable project context for each cycle.",
    gradient: "from-white/5 to-white/0",
  },
  {
    title: "Generate with control",
    body: "Chat-first creation with structured strategy, copy generation, and render controls under one operator surface.",
    gradient: "from-white/5 to-white/0",
  },
  {
    title: "Ship and learn",
    body: "Approve assets, push to queue, and iterate from tracked performance data and credit-backed workflows.",
    gradient: "from-white/5 to-white/0",
  },
];

const steps = [
  "Capture business context and website signals",
  "Generate strategy and content items for the week",
  "Render short-form assets and review outputs",
  "Export or publish and measure conversions",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function LandingPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 md:space-y-8"
    >
      {/* Hero */}
      <motion.section
        variants={itemVariants}
        className="cl-card relative overflow-hidden p-5 md:p-10"
      >
        {/* Decorative blobs with animation */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" as const }}
          className="absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl bg-white/[0.03] md:h-56 md:w-56"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" as const }}
          className="absolute -bottom-20 left-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl md:h-56 md:w-56"
        />
        <div className="relative grid gap-6 md:gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 md:space-y-5">
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="cl-kicker"
            >
              ClipLoop Platform
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl"
            >
              Build weekly growth assets without{" "}
              <span className="gradient-text">rebuilding your workflow</span>{" "}
              every week.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="max-w-2xl text-base leading-7 text-[#8B8B8B] text-[#8B8B8B]"
            >
              ClipLoop is a creative video operating system for businesses and
              creators: context assembly, planning, generation, rendering, and
              delivery in one controlled loop.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              <a
                href="https://app.cliploop.site/app"
                className="cl-btn-primary rounded-lg"
              >
                Open workspace
              </a>
              <Link to="/pricing" className="cl-btn-ghost">
                View pricing
              </Link>
            </motion.div>
          </div>

          {/* Weekly cycle card */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" as const }}
            className="cl-card-soft p-5"
          >
            <p className="text-sm font-semibold text-white text-white">
              Weekly operator cycle
            </p>
            <div className="mt-4 space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-3 rounded-lg border border-[#1F1F1F] bg-[#0E0E0E] p-3 border-[#1F1F1F] bg-[#0E0E0E]"
                >
                  <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full border border-[#333333] bg-[#0E0E0E] text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm text-[#8B8B8B] text-[#8B8B8B]">
                    {step}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Pillars */}
      <motion.section
        variants={itemVariants}
        className="grid gap-4 md:grid-cols-3"
      >
        {pillars.map((pillar) => (
          <motion.article
            key={pillar.title}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`cl-card p-5 bg-gradient-to-br ${pillar.gradient}  `}
          >
            <h2 className="text-base font-semibold text-white text-white">
              {pillar.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#8B8B8B] text-[#8B8B8B]">
              {pillar.body}
            </p>
          </motion.article>
        ))}
      </motion.section>

      {/* Roadmap section */}
      <motion.section
        variants={itemVariants}
        className="cl-card p-5 md:p-8"
      >
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="cl-kicker">Open Core Direction</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white text-white">
              First-party app now, open engine plus hosted gateway next.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#8B8B8B] text-[#8B8B8B]">
              ClipLoop is being split into app UX, reusable engine logic, and
              managed hosted execution for production reliability and credits.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                name: "First-party app",
                desc: "Dashboard, create flow, chat workspace, onboarding, manual queue.",
              },
              {
                name: "Open core",
                desc: "Context assembly, provider interfaces, render contracts, planning modules.",
              },
              {
                name: "Hosted gateway",
                desc: "Managed API keys, orchestration, provider access, render workers, and credit enforcement.",
                span: "sm:col-span-2",
              },
            ].map((item) => (
              <motion.div
                key={item.name}
                whileHover={{ scale: 1.02 }}
                className={`cl-card-soft p-4 ${item.span || ""}`}
              >
                <p className="text-sm font-medium text-white text-white">
                  {item.name}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#8B8B8B] text-[#8B8B8B]">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        variants={itemVariants}
        className="cl-card relative overflow-hidden p-6 text-center md:p-8"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const }}
          className="absolute inset-0 bg-gradient-to-r from-white/[0.02] via-transparent to-white/[0.02]"
        />
        <div className="relative">
          <h2 className="text-xl font-semibold text-white md:text-2xl">
            Ready to build your growth loop?
          </h2>
          <p className="mt-2 text-sm text-[#8B8B8B]">
            Start with one project and see how ClipLoop changes your weekly
            workflow.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="mt-6"
          >
            <a
              href="https://app.cliploop.site/app"
              className="inline-flex rounded-lg bg-white px-6 py-3 text-sm font-medium text-black shadow-lg transition hover:bg-neutral-200"
            >
              Get started free
            </a>
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
  );
}
