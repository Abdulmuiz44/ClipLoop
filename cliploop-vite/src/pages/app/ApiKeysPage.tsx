import { motion } from "framer-motion";

export default function ApiKeysPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div>
        <h1 className="text-2xl font-semibold text-white text-white">API Keys</h1>
        <p className="mt-1 text-sm text-[#8B8B8B] text-[#8B8B8B]">
          Manage your developer API keys for programmatic access.
        </p>
      </div>

      <div className="rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] p-5 shadow-sm border-[#1F1F1F] bg-[#0E0E0E]">
        <p className="text-sm text-[#8B8B8B] text-[#8B8B8B]">
          No API keys yet. Create one to start building with ClipLoop.
        </p>
        <button className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200">
          + Generate API Key
        </button>
      </div>
    </motion.div>
  );
}
