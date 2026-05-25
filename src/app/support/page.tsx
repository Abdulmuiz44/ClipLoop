import Link from "next/link";
import { ClipLoopLogo } from "@/components/ui/cliploop-logo";

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="cl-card space-y-4 p-6 md:p-8">
        <ClipLoopLogo href="/" />
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Support</h1>
        <p className="text-sm leading-6 text-slate-600">Need help with ClipLoop? Reach out and we will get back to you.</p>
        <Link href="/request-access" className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">
          Contact support
        </Link>
      </section>
    </div>
  );
}
