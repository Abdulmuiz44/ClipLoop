import { ClipLoopLogo } from "@/components/ui/cliploop-logo";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="cl-card space-y-4 p-6 md:p-8">
        <ClipLoopLogo href="/" />
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Terms</h1>
        <p className="text-sm leading-6 text-slate-600">
          ClipLoop is provided as-is during beta. Use the platform responsibly and avoid uploading content you do not own or control.
        </p>
      </section>
    </div>
  );
}
