import { motion } from "framer-motion";

export default function CreatePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div>
        <h1 className="text-xl font-semibold text-white md:text-2xl">Create</h1>
        <p className="mt-1 text-sm text-[#8B8B8B]">
          Generate video or copy content for your brand.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { title: "Generate Video", desc: "Turn your idea into a short-form video with AI-powered editing and captions.", coming: false },
          { title: "Generate Copy", desc: "Create hooks, captions, ad copy, and scripts optimized for each platform.", coming: false },
          { title: "Weekly Promo Pack", desc: "Get a full week of content planned, written, and rendered automatically.", coming: true },
          { title: "Import Website", desc: "Let ClipLoop learn your brand from your existing web presence.", coming: false },
        ].map((item) => (
          <motion.div
            key={item.title}
            whileHover={{ y: -4, scale: 1.01 }}
            className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-white md:text-lg">{item.title}</h3>
              {item.coming && (
                <span className="flex-shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                  Coming Soon
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-[#8B8B8B]">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
