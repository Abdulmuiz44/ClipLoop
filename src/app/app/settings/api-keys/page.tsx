import { StudioShell } from "@/components/app/studio-shell";
import { ApiKeysManager } from "@/components/app/api-keys-manager";
import { getCurrentUser } from "@/lib/auth";
import { listProjectsForUser } from "@/domains/projects/service";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  const user = await getCurrentUser();
  const projects = await listProjectsForUser(user.id);

  return (
    <StudioShell
      title="API Keys"
      subtitle="Create, rotate, and revoke keys for your public API integration."
      userName={user.fullName}
      userEmail={user.email}
    >
      <ApiKeysManager
        projects={projects.map((p) => ({
          id: p.id,
          name: p.productName || p.name,
        }))}
      />
    </StudioShell>
  );
}
