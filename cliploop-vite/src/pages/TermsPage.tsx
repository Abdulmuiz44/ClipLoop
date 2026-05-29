import { motion } from "framer-motion";

export default function TermsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="cl-card p-5 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-white md:text-2xl">Terms of Service</h1>
      <p className="mt-4 text-sm leading-6 text-[#8B8B8B]">These terms govern your use of ClipLoop. By using ClipLoop, you agree to these terms.</p>
      <p className="mt-3 text-sm leading-6 text-[#8B8B8B]">Contact support at <a href="mailto:support@cliploop.site" className="text-white hover:underline">support@cliploop.site</a> with any questions.</p>
    </motion.div>
  );
}
