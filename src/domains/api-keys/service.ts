import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { generateApiKey, hashApiKey } from "@/lib/security/api-keys";
import { normalizeRequestedScopes } from "@/lib/public-api/scopes";

export class ApiKeyAuthError extends Error {
  constructor(message = "Invalid API key.") {
    super(message);
  }
}

export async function createApiKey(input: {
  userId: string;
  label: string;
  projectId?: string | null;
  scopes?: string[];
}) {
  const { apiKey, keyPrefix, keyHash } = generateApiKey();
  const requested = input.scopes ?? ["weekly_promo:generate"];
  const scopes = normalizeRequestedScopes(requested);
  if (scopes.length === 0) {
    throw new Error("At least one valid scope is required.");
  }

  const [row] = await db
    .insert(schema.apiKeys)
    .values({
      userId: input.userId,
      projectId: input.projectId ?? null,
      label: input.label,
      keyPrefix,
      keyHash,
      scopesJson: scopes,
    })
    .returning();

  if (!row) throw new Error("Failed to create API key.");

  return {
    apiKey, // return ONLY ONCE to caller
    apiKeyId: row.id,
    keyPrefix: row.keyPrefix,
    label: row.label,
    scopes: row.scopesJson as string[],
    createdAt: row.createdAt,
  };
}

export async function listApiKeys(userId: string) {
  const keys = await db.query.apiKeys.findMany({
    where: eq(schema.apiKeys.userId, userId),
    orderBy: desc(schema.apiKeys.createdAt),
  });

  return keys.map((k) => ({
    id: k.id,
    label: k.label,
    keyPrefix: k.keyPrefix,
    status: k.status,
    scopes: (k.scopesJson as string[]) ?? [],
    createdAt: k.createdAt,
    revokedAt: k.revokedAt,
    lastUsedAt: k.lastUsedAt,
  }));
}

export async function revokeApiKey(input: { userId: string; apiKeyId: string }) {
  const [updated] = await db
    .update(schema.apiKeys)
    .set({ status: "revoked", revokedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(schema.apiKeys.id, input.apiKeyId), eq(schema.apiKeys.userId, input.userId)))
    .returning();

  if (!updated) {
    throw new Error("API key not found.");
  }

  return { ok: true } as const;
}

export async function authenticateApiKey(apiKey: string) {
  const keyHash = hashApiKey(apiKey);
  const key = await db.query.apiKeys.findFirst({ where: eq(schema.apiKeys.keyHash, keyHash) });

  if (!key) throw new ApiKeyAuthError();
  if (key.status !== "active") throw new ApiKeyAuthError("API key revoked.");

  await db
    .update(schema.apiKeys)
    .set({ lastUsedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.apiKeys.id, key.id));

  return {
    userId: key.userId,
    projectId: key.projectId ?? null,
    apiKeyId: key.id,
    keyPrefix: key.keyPrefix,
    scopes: (key.scopesJson as string[]) ?? [],
  };
}
