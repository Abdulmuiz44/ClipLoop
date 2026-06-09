import Link from "next/link";
import { StudioShell } from "@/components/app/studio-shell";
import { GuidedCreateFlow } from "@/components/app/guided-create-flow";
import { getCurrentUser } from "@/lib/auth";
import { getCreditWalletSummary } from "@/domains/credits/service";
import { getPrimaryProjectForUser } from "@/domains/context/service";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const user = await getCurrentUser();
  const wallet = await getCreditWalletSummary(user.id);
  const primaryProject = await getPrimaryProjectForUser(user.id);
  const hasLowCredits = wallet.generationBalance + wallet.renderBalance <= 3;

  if (!primaryProject) {
    return (
      <StudioShell title="Guided Create" subtitle="Set up your single MVP project before generating the weekly promo loop.">
        <div className="cl-card space-y-4 p-6">
          <div>
            <p className="cl-kicker">Project required</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">ClipLoop runs the MVP loop from one project.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Create your workspace first so the brief, channel lock, and weekly content pack stay tied to one product story.</p>
          </div>
          <Link href="/dashboard/projects/new" className="inline-flex w-fit rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">Create your project</Link>
        </div>
      </StudioShell>
    );
  }

  return (
    <StudioShell title="Guided Create" subtitle={`Generating from ${primaryProject.productName} with the MVP Instagram channel.`}>
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="cl-kicker">Active project</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">{primaryProject.productName}</p>
        <p className="mt-1 text-sm text-slate-600">Instagram only for the MVP path. Five posts is the default weekly pack size.</p>
      </div>
      <GuidedCreateFlow hasLowCredits={hasLowCredits} />
    </StudioShell>
  );
}
