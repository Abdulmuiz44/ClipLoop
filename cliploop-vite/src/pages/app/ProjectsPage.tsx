import { motion } from "framer-motion";

const projects = [
  { name: "GlowSkin Launch", type: "Beauty Brand", videos: 12, copies: 36, weeks: 2, active: true },
  { name: "TaskFlow App", type: "SaaS", videos: 18, copies: 42, weeks: 3, active: true },
  { name: "UrbanStep Sneakers", type: "E-commerce", videos: 10, copies: 28, weeks: 2, active: true },
  { name: "Nutripower Shake", type: "Health & Wellness", videos: 8, copies: 24, weeks: 1, active: false },
];

export default function ProjectsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white text-white">Projects</h1>
          <p className="mt-1 text-sm text-[#8B8B8B] text-[#8B8B8B]">
            Manage your brand projects and content strategy.
          </p>
        </div>
        <button className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500/150">
          + New Project
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, i) => (
          <motion.div
            key={project.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 shadow-sm border-[#1F1F1F] bg-[#0E0E0E]"
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-white text-white">{project.name}</p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${project.active ? "bg-emerald-500/15 text-emerald-300 bg-emerald-500/150/15 text-emerald-300" : "bg-slate-100 text-[#8B8B8B] bg-[#111111]"}`}>
                {project.active ? "Active" : "Archived"}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#8B8B8B]">{project.type}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#1F1F1F] pt-3 border-[#1F1F1F]">
              <div className="text-center">
                <p className="text-lg font-semibold text-white text-white">{project.videos}</p>
                <p className="text-xs text-[#8B8B8B]">Videos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white text-white">{project.copies}</p>
                <p className="text-xs text-[#8B8B8B]">Copies</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white text-white">{project.weeks}</p>
                <p className="text-xs text-[#8B8B8B]">Weeks</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
