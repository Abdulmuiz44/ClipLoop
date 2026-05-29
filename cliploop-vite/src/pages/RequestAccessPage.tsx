import { motion } from "framer-motion";

export default function RequestAccessPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="cl-card p-6 md:p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-white text-white">Request Access</h1>
      <p className="mt-4 text-sm leading-6 text-[#8B8B8B] text-[#8B8B8B]">ClipLoop is currently in beta. Drop your email and we'll notify you when access opens.</p>
      <div className="mt-6 flex gap-3">
        <input type="email" placeholder="your@email.com" className="cl-input flex-1" />
        <button className="cl-btn-primary">Request</button>
      </div>
    </motion.div>
  );
}
