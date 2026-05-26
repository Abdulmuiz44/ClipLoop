import { StudioShell } from "@/components/app/studio-shell";
import { ApiKeysManager } from "@/components/app/api-keys-manager";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const user = await getCurrentUser();

  return (
    <StudioShell
      title="API Keys"
      subtitle="Create, rotate, and revoke keys for your public API integration."
      userName={user.fullName}
      userEmail={user.email}
    >
      <ApiKeysManager />
    </StudioShell>
  );
}
