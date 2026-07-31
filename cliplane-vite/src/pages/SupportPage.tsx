import { motion } from "framer-motion";

export default function SupportPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="cl-card p-5 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-white md:text-2xl">Support</h1>
      <p className="mt-4 text-sm leading-6 text-[#8B8B8B]">Need help? Email us at <a href="mailto:support@cliplane.site" className="text-white hover:underline">support@cliplane.site</a> and we&apos;ll get back to you.</p>
    </motion.div>
  );
}
