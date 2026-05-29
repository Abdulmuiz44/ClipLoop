import { and, desc, eq, gte, sql } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getCreditWalletSummary } from "@/domains/credits/service";

type UsageEventRaw = {
  id: string;
  action: string;
  source: "web" | "public_api";
  creditsBucket: string | null;
  creditsAmount: number | null;
  referenceType: string | null;
  referenceId: string | null;
  metadataJson: Record<string, unknown>;
  createdAt: Date;
  projectId: string | null;
  apiKeyId: string | null;
};

type ApiKeyInfo = {
  id: string;
  label: string;
  keyPrefix: string;
  status: "active" | "revoked" | string;
  scopes: string[];
  createdAt: Date;
};

export type DashboardUsageData = {
  credits: {
    generationBalance: number;
    renderBalance: number;
    totalBalance: number;
    periodKey: string;
  };
  usageEvents: Array<{
    id: string;
    action: string;
    source: string;
    creditsBucket: string | null;
    creditsAmount: number | null;
    createdAt: string;
    keyPrefix: string | null;
  }>;
  breakdownByAction: Record<string, number>;
  publicApiUsageCount: number;
  creditsSpentLast7d: number;
  creditsSpentLast30d: number;
  apiKeys: Array<{
    id: string;
    label: string;
    keyPrefix: string;
    status: string;
    scopes: string[];
    createdAt: string;
    lastUsedAt: string | null;
  }>;
};

function sqlToISO(val: Date | string | null): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  return val;
}

export async function getDashboardUsageData(userId: string): Promise<DashboardUsageData> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [wallet, events, apiKeys, creditsSpent7d, creditsSpent30d] = await Promise.all([
    getCreditWalletSummary(userId).catch(() => ({
      generationBalance: 0,
      renderBalance: 0,
      periodKey: "",
    })),

    db
      .select()
      .from(schema.usageEvents)
      .where(eq(schema.usageEvents.userId, userId))
      .orderBy(desc(schema.usageEvents.createdAt))
      .limit(20)
      .then((rows) =>
        rows.map((r: UsageEventRaw) => ({
          id: r.id,
          action: r.action,
          source: r.source,
          creditsBucket: r.creditsBucket ?? null,
          creditsAmount: r.creditsAmount ?? null,
          createdAt: sqlToISO(r.createdAt) ?? "",
          keyPrefix:
            r.metadataJson && typeof r.metadataJson === "object" && "keyPrefix" in r.metadataJson
              ? String(r.metadataJson.keyPrefix)
              : null,
        })),
      ),

    db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.userId, userId))
      .orderBy(desc(schema.apiKeys.createdAt))
      .then((rows: ApiKeyInfo[]) =>
        rows.map((k) => ({
          id: k.id,
          label: k.label,
          keyPrefix: k.keyPrefix,
          status: k.status,
          scopes: k.scopes,
          createdAt: sqlToISO(k.createdAt) ?? "",
          lastUsedAt: sqlToISO(k.lastUsedAt) ?? null,
        })),
      ),

    // Credits spent (debits) in last 7 days
    db
      .select({
        total: sql<number>`coalesce(abs(sum(${schema.creditLedgerEntries.amountDelta})), 0)`,
      })
      .from(schema.creditLedgerEntries)
      .where(
        and(
          eq(schema.creditLedgerEntries.userId, userId),
          eq(schema.creditLedgerEntries.direction, "debit"),
          gte(schema.creditLedgerEntries.createdAt, sevenDaysAgo),
        ),
      )
      .then((rows) => rows[0]?.total ?? 0),

    // Credits spent (debits) in last 30 days
    db
      .select({
        total: sql<number>`coalesce(abs(sum(${schema.creditLedgerEntries.amountDelta})), 0)`,
      })
      .from(schema.creditLedgerEntries)
      .where(
        and(
          eq(schema.creditLedgerEntries.userId, userId),
          eq(schema.creditLedgerEntries.direction, "debit"),
          gte(schema.creditLedgerEntries.createdAt, thirtyDaysAgo),
        ),
      )
      .then((rows) => rows[0]?.total ?? 0),
  ]);

  // Build breakdown by action from the 20 recent events
  const breakdownByAction: Record<string, number> = {};
  for (const ev of events) {
    breakdownByAction[ev.action] = (breakdownByAction[ev.action] || 0) + 1;
  }

  // Count public API usage from the full events list
  const publicApiUsageCount = events.filter((ev) => ev.source === "public_api").length;

  return {
    credits: {
      generationBalance: wallet.generationBalance ?? 0,
      renderBalance: wallet.renderBalance ?? 0,
      totalBalance: (wallet.generationBalance ?? 0) + (wallet.renderBalance ?? 0),
      periodKey: wallet.periodKey ?? "",
    },
    usageEvents: events,
    breakdownByAction,
    publicApiUsageCount,
    creditsSpentLast7d,
    creditsSpentLast30d,
    apiKeys,
  };
}
