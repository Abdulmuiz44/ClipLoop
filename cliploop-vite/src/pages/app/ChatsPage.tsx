import { motion } from "framer-motion";

export default function ChatsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div>
        <h1 className="text-2xl font-semibold text-white text-white">Chats</h1>
        <p className="mt-1 text-sm text-[#8B8B8B] text-[#8B8B8B]">
          Chat with ClipLoop to generate ideas, plan strategy, and more.
        </p>
      </div>

      <div className="flex h-[400px] items-center justify-center rounded-2xl border border-[#1F1F1F] bg-[#0E0E0E] border-[#1F1F1F] bg-[#0E0E0E]">
        <div className="text-center">
          <p className="text-4xl">💬</p>
          <p className="mt-3 text-sm text-[#8B8B8B] text-[#8B8B8B]">
            Select a conversation or start a new chat
          </p>
          <button className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500/150">
            + New Chat
          </button>
        </div>
      </div>
    </motion.div>
  );
}
