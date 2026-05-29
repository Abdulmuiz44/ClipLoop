import type { PublicApiScopeId } from "@/lib/public-api/scopes";

export type PublicApiIdentity = {
  userId: string;
  projectId: string | null;
  apiKeyId: string;
  keyPrefix: string;
  scopes: string[];
};

export function assertHasScope(identity: PublicApiIdentity, scope: PublicApiScopeId) {
  if (!identity.scopes.includes(scope)) {
    return {
      ok: false as const,
      status: 403 as const,
      body: { error: "Insufficient scope.", code: "SCOPE_DENIED", requiredScope: scope },
    };
  }
  return { ok: true as const };
}

export function assertProjectScope(identity: PublicApiIdentity, projectId: string) {
  // If the API key is pinned to a project, it can only access that project.
  if (identity.projectId && identity.projectId !== projectId) {
    return {
      ok: false as const,
      status: 403 as const,
      body: { error: "API key is not permitted to access this project.", code: "PROJECT_SCOPE_DENIED" },
    };
  }
  return { ok: true as const };
}
