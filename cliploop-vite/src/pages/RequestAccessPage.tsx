import { motion } from "framer-motion";

export default function RequestAccessPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="cl-card p-5 md:p-8 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold text-white md:text-2xl">Request Access</h1>
      <p className="mt-4 text-sm leading-6 text-[#8B8B8B]">ClipLoop is currently in beta. Drop your email and we&apos;ll notify you when access opens.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input type="email" placeholder="your@email.com" className="cl-input flex-1" />
        <button className="cl-btn-primary">Request</button>
      </div>
    </motion.div>
  );
}
