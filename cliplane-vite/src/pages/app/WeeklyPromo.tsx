import { motion } from "framer-motion";

export default function WeeklyPromoPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div>
        <h1 className="text-xl font-semibold text-white md:text-2xl">Templates</h1>
        <p className="mt-1 text-sm text-[#8B8B8B]">
          Browse and use pre-built templates for your content.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "Product Launch", desc: "Generate buzz for a new product release." },
          { name: "Weekly Digest", desc: "Summarize your week's best content." },
          { name: "Testimonial", desc: "Turn customer reviews into social proof." },
          { name: "How-To", desc: "Educational content for your audience." },
          { name: "Behind the Scenes", desc: "Show the human side of your brand." },
          { name: "Holiday Special", desc: "Seasonal content that connects." },
        ].map((template, i) => (
          <motion.div
            key={template.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-4 cursor-pointer"
          >
            <p className="text-sm font-semibold text-white">{template.name}</p>
            <p className="mt-2 text-xs text-[#8B8B8B]">{template.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
