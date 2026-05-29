import { motion } from "framer-motion";

export default function PrivacyPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="cl-card p-5 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-white md:text-2xl">Privacy Policy</h1>
      <p className="mt-4 text-sm leading-6 text-[#8B8B8B]">ClipLoop respects your privacy. We only collect data necessary to provide our service.</p>
      <p className="mt-3 text-sm leading-6 text-[#8B8B8B]">For questions, contact <a href="mailto:support@cliploop.site" className="text-white hover:underline">support@cliploop.site</a>.</p>
    </motion.div>
  );
}
