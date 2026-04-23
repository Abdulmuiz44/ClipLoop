import { StudioShell } from "@/components/app/studio-shell";
import { GuidedCreateFlow } from "@/components/app/guided-create-flow";
import { getCurrentUser } from "@/lib/auth";
import { getCreditWalletSummary } from "@/domains/credits/service";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const user = await getCurrentUser();
  const wallet = await getCreditWalletSummary(user.id);
  const hasLowCredits = wallet.generationBalance + wallet.renderBalance <= 3;

  return (
    <StudioShell title="Guided Create" subtitle="Turn a rough idea into a structured brief, then generate a final promo video.">
      <GuidedCreateFlow hasLowCredits={hasLowCredits} />
    </StudioShell>
  );
}
