import { ClipLaneLogo } from "@/components/ui/cliplane-logo";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="cl-card space-y-4 p-6 md:p-8">
        <ClipLaneLogo href="/" />
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Privacy</h1>
        <p className="text-sm leading-6 text-slate-600">
          We keep data needed to run your workspace and improve reliability. We do not sell your data.
        </p>
      </section>
    </div>
  );
}
