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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white md:text-2xl">Projects</h1>
          <p className="mt-1 text-sm text-[#8B8B8B]">
            Manage your brand projects and content strategy.
          </p>
        </div>
        <button className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-black hover:bg-neutral-200">
          + New Project
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, i) => (
          <motion.div
            key={project.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-white">{project.name}</p>
              <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] ${project.active ? "bg-white/15 text-white" : "bg-[#111111] text-[#8B8B8B]"}`}>
                {project.active ? "Active" : "Archived"}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#8B8B8B]">{project.type}</p>
            <div className="mt-4 flex gap-3 border-t border-[#1F1F1F] pt-3 text-xs text-[#8B8B8B]">
              <span><span className="font-semibold text-white">{project.videos}</span> Videos</span>
              <span><span className="font-semibold text-white">{project.copies}</span> Copies</span>
              <span><span className="font-semibold text-white">{project.weeks}</span> Weeks</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
