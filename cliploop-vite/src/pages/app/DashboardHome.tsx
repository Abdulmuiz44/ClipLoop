import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const quickActions = [
  { title: "Generate Video", detail: "Turn your idea into a scroll-stopping video.", color: "from-white/10 to-white/5", icon: "🎬" },
  { title: "Generate Copy", detail: "Create hooks, captions and ad copy.", color: "from-white/10 to-white/5", icon: "✍️" },
  { title: "New Project", detail: "Create a new project for your brand.", color: "from-white/10 to-white/5", icon: "📁" },
  { title: "Import Website", detail: "Import your website to learn about your brand.", color: "from-white/10 to-white/5", icon: "🌐" },
];

const demoProjects = [
  { name: "GlowSkin Launch", type: "Beauty Brand", updated: "Updated 2h ago", videos: 12, copies: 36, weeks: 2 },
  { name: "TaskFlow App", type: "SaaS", updated: "Updated 1d ago", videos: 18, copies: 42, weeks: 3 },
  { name: "UrbanStep Sneakers", type: "E-commerce", updated: "Updated 2d ago", videos: 10, copies: 28, weeks: 2 },
  { name: "Nutripower Shake", type: "Health & Wellness", updated: "Updated 3d ago", videos: 8, copies: 24, weeks: 1 },
];

const recentOutputs = [
  { name: "GlowSkin Promo", meta: "15s • 1080x1920", kind: "Video", when: "2h ago" },
  { name: "Nutripower Ad", meta: "30s • 1080x1080", kind: "Video", when: "5h ago" },
  { name: "TaskFlow Hook", meta: "Caption + Copy", kind: "Copy", when: "1d ago" },
  { name: "Summer Drop Teaser", meta: "15s • 1080x1920", kind: "Video", when: "2d ago" },
];

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function DashboardHome() {
  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="space-y-5">
        <motion.div variants={itemAnim}>
          <h1 className="text-3xl font-semibold tracking-tight text-white text-white">
            Welcome back, John! 👋
          </h1>
          <p className="mt-1 text-sm text-[#8B8B8B] text-[#8B8B8B]">
            Create, package, and post scroll-stopping content faster.
          </p>
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={itemAnim} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((item) => (
            <motion.div
              key={item.title}
              whileHover={{ y: -4, scale: 1.02 }}
              className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 shadow-sm transition hover:border-[#1F1F1F] border-[#1F1F1F] bg-[#0E0E0E] cursor-pointer"
            >
              <div className={`mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${item.color}`}>
                <span>{item.icon}</span>
              </div>
              <p className="text-base font-semibold text-white text-white">{item.title}</p>
              <p className="mt-1 text-sm text-[#8B8B8B] text-[#8B8B8B]">{item.detail}</p>
              <p className="mt-3 text-sm text-[#8B8B8B]">→</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Projects */}
        <motion.div variants={itemAnim}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white text-white">Your Projects</h2>
            <Link to="/app/projects" className="text-sm text-[#8B8B8B] hover:text-white hover:text-white">
              View all projects →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {demoProjects.map((project, i) => (
              <motion.div
                key={project.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ y: -4 }}
                className="min-w-[260px] flex-1 overflow-hidden rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] shadow-sm border-[#1F1F1F] bg-[#0E0E0E] cursor-pointer"
              >
                <div className="relative h-32 bg-gradient-to-br from-[#111111] via-[#0E0E0E] to-[#050505]">
                  <div className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white">▶</div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-white text-white">{project.name}</p>
                  <p className="text-xs text-[#8B8B8B]">{project.type}</p>
                  <p className="mt-2 text-xs text-[#8B8B8B]">{project.updated}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#1F1F1F] pt-3 border-[#1F1F1F]">
                    {[
                      { label: "Videos", value: project.videos },
                      { label: "Copies", value: project.copies },
                      { label: "Weeks", value: project.weeks },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-1.5 text-xs text-[#8B8B8B] text-[#8B8B8B]">
                        <span className="font-medium text-white text-white">{s.value}</span>
                        {s.label}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Activity + Usage */}
        <motion.div variants={itemAnim} className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 shadow-sm border-[#1F1F1F] bg-[#0E0E0E]">
            <h3 className="text-lg font-semibold text-white text-white">Recent Activity</h3>
            <ul className="mt-4 space-y-3">
              {["Video generated", "Copy generated", "Website imported", "Project created"].map((label, idx) => (
                <li key={label} className="flex items-start gap-3 rounded-xl bg-[#111111] p-3 text-sm bg-[#111111]">
                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/5">🎬</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white text-white">{label}</p>
                    <p className="mt-0.5 text-xs text-[#8B8B8B]">GlowSkin Launch • 15s Promo</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#8B8B8B]">{idx === 0 ? "2h ago" : `${idx + 2}h ago`}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 shadow-sm border-[#1F1F1F] bg-[#0E0E0E]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white text-white">Usage Overview</h3>
              <span className="rounded-xl border border-[#1F1F1F] bg-[#0E0E0E] px-3 py-1 text-xs text-[#8B8B8B] border-[#1F1F1F] bg-[#0E0E0E]">
                This Month
              </span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
              <div className="grid place-items-center">
                <div className="grid h-36 w-36 place-items-center rounded-full" style={{ background: "conic-gradient(#A3A3A3 0 70%, #555555 70% 88%, #333333 88% 100%)" }}>
                  <div className="grid place-items-center rounded-full bg-[#0E0E0E] shadow-sm bg-[#0E0E0E]" style={{ width: 104, height: 104 }}>
                    <p className="text-2xl font-semibold text-white text-white">73</p>
                    <p className="text-xs text-[#8B8B8B]">Credits Used</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-[#8B8B8B] text-[#8B8B8B]">
                {[
                  { label: "Videos", color: "bg-white/20", value: "50 credits" },
                  { label: "Copies", color: "bg-violet-500/150", value: "18 credits" },
                  { label: "Others", color: "bg-amber-400", value: "5 credits" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      {item.label}
                    </span>
                    <span className="text-[#8B8B8B] text-[#8B8B8B]">{item.value}</span>
                  </div>
                ))}
                <div className="mt-4 flex items-center justify-between border-t border-[#1F1F1F] pt-3 text-xs border-[#1F1F1F]">
                  <span className="text-[#8B8B8B]">Total Credits Used</span>
                  <span className="text-[#8B8B8B]">73 / 200</span>
                </div>
              </div>
            </div>
          </section>
        </motion.div>
      </section>

      {/* Sidebar */}
      <aside className="space-y-4">
        {/* Credits */}
        <motion.section variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 shadow-sm border-[#1F1F1F] bg-[#0E0E0E]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white text-white">Credits Balance</p>
              <p className="mt-2 text-4xl font-semibold text-white text-white">
                127 <span className="text-base font-normal text-[#8B8B8B]">credits</span>
              </p>
            </div>
            <button className="mt-1 h-10 rounded-2xl bg-[#050505] px-4 text-sm font-semibold text-white shadow-sm bg-[#0E0E0E]">
              Buy Credits
            </button>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-[#1F1F1F] bg-[#1F1F1F]">
            <div className="h-1.5 w-4/5 rounded-full bg-white/20" />
          </div>
          <p className="mt-2 text-xs text-[#8B8B8B]">You have enough credits to generate 8 more videos.</p>
        </motion.section>

        {/* Plan */}
        <motion.section variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 shadow-sm border-[#1F1F1F] bg-[#0E0E0E]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#0E0E0E] text-white">CL</span>
              <div>
                <p className="text-sm font-semibold text-white text-white">Pro Plan</p>
                <p className="text-xs text-[#8B8B8B]">Renews on May 12, 2025</p>
              </div>
            </div>
            <span className="rounded-full border border-[#333333] px-2 py-0.5 text-xs font-medium text-[#A3A3A3]">
              Active
            </span>
          </div>
        </motion.section>

        {/* Recent Outputs */}
        <motion.section variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 shadow-sm border-[#1F1F1F] bg-[#0E0E0E]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white text-white">Recent Outputs</p>
            <Link to="/app/projects" className="text-xs text-[#8B8B8B] hover:text-white hover:text-white">
              View all →
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {recentOutputs.map((item) => (
              <li key={item.name} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#111111] to-[#050505]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white text-white">{item.name}</p>
                  <p className="text-xs text-[#8B8B8B]">{item.meta}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] bg-[#1F1F1F] text-slate-200`}>
                  {item.kind}
                </span>
                <span className="text-xs text-[#8B8B8B]">{item.when}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Tips */}
        <motion.section variants={itemAnim} className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 shadow-sm border-[#1F1F1F] bg-[#0E0E0E]">
          <p className="text-sm font-semibold text-white text-white">Tips to get better results</p>
          <ul className="mt-4 space-y-3 text-sm text-[#8B8B8B] text-[#8B8B8B]">
            {[
              { icon: "🔎", title: "Be specific with your idea", desc: "Add details about your audience, offer and goal." },
              { icon: "📣", title: "Choose the right channel", desc: "Different platforms need different styles." },
              { icon: "🏷️", title: "Use your brand context", desc: "Import your site or add more brand info." },
            ].map((tip) => (
              <li key={tip.title} className="flex gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#1F1F1F] text-slate-300 bg-[#111111] text-slate-200">
                  {tip.icon}
                </span>
                <div>
                  <p className="font-medium text-white text-white">{tip.title}</p>
                  <p className="text-xs text-[#8B8B8B]">{tip.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>
      </aside>
    </motion.div>
  );
}
