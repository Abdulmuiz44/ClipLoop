export const PUBLIC_API_SCOPES = [
  // Weekly promo generation
  "weekly_promo:generate",

  // Read-only developer analytics
  "usage:read",
  "credits:read",

  // Project discovery (for mapping projectId)
  "projects:read",

  // Schedule direct publishing for content within the key's project scope.
  "content:schedule",
] as const;

export type PublicApiScopeId = (typeof PUBLIC_API_SCOPES)[number];

export function isPublicApiScopeId(value: string): value is PublicApiScopeId {
  return (PUBLIC_API_SCOPES as readonly string[]).includes(value);
}

export function normalizeRequestedScopes(input: unknown): PublicApiScopeId[] {
  if (!Array.isArray(input)) return [];
  const out: PublicApiScopeId[] = [];
  for (const item of input) {
    if (typeof item !== "string") continue;
    if (!isPublicApiScopeId(item)) continue;
    out.push(item);
  }
  // de-dupe while keeping order
  return [...new Set(out)];
}
