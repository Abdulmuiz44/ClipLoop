import { desc, eq } from "drizzle-orm";

import { db, schema } from "@/lib/db";

export type UsageEvent = {
  id: string;
  action: string;
  source: "web" | "public_api";
  creditsBucket: string | null;
  creditsAmount: number | null;
  createdAt: Date;
};

export async function listRecentUsageEvents(userId: string, limit = 20): Promise<UsageEvent[]> {
  const rows = await db.query.usageEvents.findMany({
    where: eq(schema.usageEvents.userId, userId),
    orderBy: desc(schema.usageEvents.createdAt),
    limit,
  });

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    source: r.source as "web" | "public_api",
    creditsBucket: r.creditsBucket ?? null,
    creditsAmount: r.creditsAmount ?? null,
    createdAt: r.createdAt,
  }));
}

export async function recordUsageEvent(input: {
  userId: string;
  projectId?: string | null;
  apiKeyId?: string | null;
  source: "web" | "public_api";
  action: string;
  creditsBucket?: string | null;
  creditsAmount?: number | null;
  referenceType?: string | null;
  referenceId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(schema.usageEvents).values({
    userId: input.userId,
    projectId: input.projectId ?? null,
    apiKeyId: input.apiKeyId ?? null,
    source: input.source,
    action: input.action,
    creditsBucket: input.creditsBucket ?? null,
    creditsAmount: input.creditsAmount ?? null,
    referenceType: input.referenceType ?? null,
    referenceId: input.referenceId ?? null,
    metadataJson: input.metadata ?? {},
  });
}
