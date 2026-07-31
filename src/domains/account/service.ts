import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { getLatestSubscriptionForUser, subscriptionConfersStarterAccess } from "@/domains/billing/service";
import { OFFLINE_DEMO_USER_ID } from "@/lib/auth";
import { getCreditWalletSummary } from "@/domains/credits/service";
import { listApiKeys } from "@/domains/api-keys/service";

export type PlanType = "free" | "starter" | "beta";

export type PlanLimits = {
  activeProjects: number;
  postsPerWeek: number;
  postsPerMonth: number;
  manualRegenerationsPerWeek: number;
  rendersPerMonth: number;
  publishesPerMonth: number;
  connectedChannels: number;
};

function toFiniteNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export type CurrentUsageSummary = {
  limits: PlanLimits;
  usage: {
    postsPerWeek: number;
    postsPerMonth: number;
    manualRegenerationsPerWeek: number;
    rendersPerMonth: number;
    publishesPerMonth: number;
  };
  remaining: {
    postsPerWeek: number;
    postsPerMonth: number;
    manualRegenerationsPerWeek: number;
    rendersPerMonth: number;
    publishesPerMonth: number;
  };
  periods: {
    week: { start: string; end: string };
    month: { start: string; end: string };
  };
};

const NO_ACCESS_LIMITS: PlanLimits = {
  activeProjects: 0,
  postsPerWeek: 0,
  postsPerMonth: 0,
  manualRegenerationsPerWeek: 0,
  rendersPerMonth: 0,
  publishesPerMonth: 0,
  connectedChannels: 0,
};

const FREE_TRIAL_LIMITS: PlanLimits = {
  activeProjects: 1,
  postsPerWeek: 3,
  postsPerMonth: 12,
  manualRegenerationsPerWeek: 2,
  rendersPerMonth: 6,
  publishesPerMonth: 6,
  connectedChannels: 1,
};

const STARTER_LIMITS: PlanLimits = {
  activeProjects: 5,
  postsPerWeek: 20,
  postsPerMonth: 80,
  manualRegenerationsPerWeek: 10,
  rendersPerMonth: 40,
  publishesPerMonth: 40,
  connectedChannels: 1,
};

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: FREE_TRIAL_LIMITS,
  starter: STARTER_LIMITS,
  beta: STARTER_LIMITS,
};

export class ProductAccessError extends Error {
  constructor(message = "ClipLane access is currently unavailable for this account.") {
    super(message);
  }
}

function isDatabaseUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("ECONNREFUSED") || message.includes("Failed query:");
}

function buildOfflineMockPlanState(userId: string) {
  const now = new Date();
  return {
    user: {
      id: userId || OFFLINE_DEMO_USER_ID,
      email: env.DEMO_USER_EMAIL,
      fullName: "ClipLane Demo User",
      plan: "beta" as const,
      billingStatus: "offline_mock",
      stripeCustomerId: null,
      lemonSqueezyCustomerId: null,
      isBetaApproved: true,
      betaApprovedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    subscription: null,
    effectivePlan: "beta" as const,
    billingStatus: "offline_mock",
    isBetaApproved: true,
    inviteOnlyMode: env.INVITE_ONLY_MODE,
    access: true,
  };
}

export function getDisplayPlanName(plan: PlanType) {
  if (plan === "starter") return "pro";
  return plan;
}

export async function getSubscriptionForUser(userId: string) {
  return getLatestSubscriptionForUser(userId);
}

export async function getUserPlanState(userId: string) {
  let user: typeof schema.users.$inferSelect | undefined;
  try {
    user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  } catch (error) {
    if (env.MOCK_MODE && isDatabaseUnavailableError(error)) {
      return buildOfflineMockPlanState(userId);
    }
    throw error;
  }

  if (!user) {
    if (env.MOCK_MODE && userId === OFFLINE_DEMO_USER_ID) {
      return buildOfflineMockPlanState(userId);
    }
    throw new Error("User not found");
  }

  const subscription = await getSubscriptionForUser(userId);
  const hasStarterSubscription = subscriptionConfersStarterAccess(subscription);
  const hasManualStarterAccess = !subscription && user.plan === "starter";

  const effectivePlan: PlanType =
    hasStarterSubscription || hasManualStarterAccess ? "starter" : ((user.plan as PlanType) ?? "free");
  const billingStatus = subscription?.status ?? user.billingStatus ?? (effectivePlan === "starter" ? "active" : "none");
  const access = true;

  return {
    user,
    subscription,
    effectivePlan,
    billingStatus,
    isBetaApproved: user.isBetaApproved,
    inviteOnlyMode: env.INVITE_ONLY_MODE,
    access,
  };
}

export function canAccessProductFromState(state: Awaited<ReturnType<typeof getUserPlanState>>) {
  return state.access;
}

export async function canAccessProduct(userId: string) {
  const state = await getUserPlanState(userId);
  return canAccessProductFromState(state);
}

export async function requireProductAccess(userId: string) {
  const state = await getUserPlanState(userId);
  const allowed = canAccessProductFromState(state);
  if (!allowed) {
    throw new ProductAccessError();
  }

  return state;
}

export async function getPlanLimitsForUser(userId: string): Promise<PlanLimits> {
  const state = await getUserPlanState(userId);
  if (!canAccessProductFromState(state)) {
    return NO_ACCESS_LIMITS;
  }

  return PLAN_LIMITS[state.effectivePlan] ?? NO_ACCESS_LIMITS;
}

export async function getCurrentUsageSummary(userId: string): Promise<CurrentUsageSummary> {
  const limits = await getPlanLimitsForUser(userId);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - now.getUTCDay());
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  const [weekly, monthly] = await Promise.all([
    db
      .select({
        postsGenerated: sql<number>`coalesce(sum(${schema.usageCounters.postsGenerated}), 0)`,
        manualRegenerations: sql<number>`coalesce(sum(${schema.usageCounters.manualRegenerations}), 0)`,
      })
      .from(schema.usageCounters)
      .where(
        and(
          eq(schema.usageCounters.userId, userId),
          eq(schema.usageCounters.periodType, "week"),
          eq(schema.usageCounters.periodStart, weekStart),
          eq(schema.usageCounters.periodEnd, weekEnd),
        ),
      ),
    db
      .select({
        postsGenerated: sql<number>`coalesce(sum(${schema.usageCounters.postsGenerated}), 0)`,
        videosRendered: sql<number>`coalesce(sum(${schema.usageCounters.videosRendered}), 0)`,
        postsPublished: sql<number>`coalesce(sum(${schema.usageCounters.postsPublished}), 0)`,
      })
      .from(schema.usageCounters)
      .where(
        and(
          eq(schema.usageCounters.userId, userId),
          eq(schema.usageCounters.periodType, "month"),
          eq(schema.usageCounters.periodStart, monthStart),
          eq(schema.usageCounters.periodEnd, monthEnd),
        ),
      ),
  ]);

  const usage = {
    postsPerWeek: toFiniteNumber(weekly[0]?.postsGenerated),
    postsPerMonth: toFiniteNumber(monthly[0]?.postsGenerated),
    manualRegenerationsPerWeek: toFiniteNumber(weekly[0]?.manualRegenerations),
    rendersPerMonth: toFiniteNumber(monthly[0]?.videosRendered),
    publishesPerMonth: toFiniteNumber(monthly[0]?.postsPublished),
  };

  return {
    limits,
    usage,
    remaining: {
      postsPerWeek: Math.max(0, limits.postsPerWeek - usage.postsPerWeek),
      postsPerMonth: Math.max(0, limits.postsPerMonth - usage.postsPerMonth),
      manualRegenerationsPerWeek: Math.max(0, limits.manualRegenerationsPerWeek - usage.manualRegenerationsPerWeek),
      rendersPerMonth: Math.max(0, limits.rendersPerMonth - usage.rendersPerMonth),
      publishesPerMonth: Math.max(0, limits.publishesPerMonth - usage.publishesPerMonth),
    },
    periods: {
      week: { start: weekStart.toISOString().slice(0, 10), end: weekEnd.toISOString().slice(0, 10) },
      month: { start: monthStart.toISOString().slice(0, 10), end: monthEnd.toISOString().slice(0, 10) },
    },
  };
}

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
    source: "web" | "public_api";
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
    status: "active" | "revoked";
    scopes: string[];
    createdAt: string;
    lastUsedAt: string | null;
  }>;
};

export async function getDashboardUsageData(userId: string): Promise<DashboardUsageData> {
  const now = new Date();

  // 1. Credit wallet
  const wallet = await getCreditWalletSummary(userId);
  const credits = {
    generationBalance: wallet.generationBalance,
    renderBalance: wallet.renderBalance,
    totalBalance: wallet.generationBalance + wallet.renderBalance,
    periodKey: wallet.periodKey,
  };

  // 2. Recent usage events (last 20) with keyPrefix from metadataJson
  const rawEvents = await db
    .select({
      id: schema.usageEvents.id,
      action: schema.usageEvents.action,
      source: schema.usageEvents.source,
      creditsBucket: schema.usageEvents.creditsBucket,
      creditsAmount: schema.usageEvents.creditsAmount,
      createdAt: schema.usageEvents.createdAt,
      metadataJson: schema.usageEvents.metadataJson,
    })
    .from(schema.usageEvents)
    .where(eq(schema.usageEvents.userId, userId))
    .orderBy(desc(schema.usageEvents.createdAt))
    .limit(20);

  const usageEvents = rawEvents.map((e) => ({
    id: e.id,
    action: e.action,
    source: (e.source ?? "web") as "web" | "public_api",
    creditsBucket: e.creditsBucket ?? null,
    creditsAmount: e.creditsAmount ?? null,
    createdAt: e.createdAt.toISOString(),
    keyPrefix: ((e.metadataJson as Record<string, unknown> | null)?.keyPrefix as string) ?? null,
  }));

  // 3. Usage breakdown by action (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const breakdownRows = await db
    .select({
      action: schema.usageEvents.action,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.usageEvents)
    .where(and(eq(schema.usageEvents.userId, userId), sql`${schema.usageEvents.createdAt} >= ${thirtyDaysAgo}`))
    .groupBy(schema.usageEvents.action)
    .orderBy(sql`count(*) desc`);

  const breakdownByAction: Record<string, number> = {};
  for (const row of breakdownRows) {
    breakdownByAction[row.action] = row.count;
  }

  // 4. Public API usage count (last 30 days)
  const [publicApiRow] = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(schema.usageEvents)
    .where(
      and(
        eq(schema.usageEvents.userId, userId),
        eq(schema.usageEvents.source, "public_api"),
        sql`${schema.usageEvents.createdAt} >= ${thirtyDaysAgo}`,
      ),
    );

  const publicApiUsageCount = publicApiRow?.count ?? 0;

  // 5. Credits spent last 7d and 30d
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [spent7dRow, spent30dRow] = await Promise.all([
    db
      .select({
        total: sql<number>`coalesce(sum(abs(${schema.creditLedgerEntries.amountDelta})), 0)::int`,
      })
      .from(schema.creditLedgerEntries)
      .where(
        and(
          eq(schema.creditLedgerEntries.userId, userId),
          eq(schema.creditLedgerEntries.direction, "debit"),
          sql`${schema.creditLedgerEntries.createdAt} >= ${sevenDaysAgo}`,
        ),
      ),
    db
      .select({
        total: sql<number>`coalesce(sum(abs(${schema.creditLedgerEntries.amountDelta})), 0)::int`,
      })
      .from(schema.creditLedgerEntries)
      .where(
        and(
          eq(schema.creditLedgerEntries.userId, userId),
          eq(schema.creditLedgerEntries.direction, "debit"),
          sql`${schema.creditLedgerEntries.createdAt} >= ${thirtyDaysAgo}`,
        ),
      ),
  ]);

  const creditsSpentLast7d = spent7dRow[0]?.total ?? 0;
  const creditsSpentLast30d = spent30dRow[0]?.total ?? 0;

  // 6. API keys (prefix only)
  const apiKeys = (await listApiKeys(userId)).map((k) => ({
    id: k.id,
    label: k.label,
    keyPrefix: k.keyPrefix,
    status: k.status as "active" | "revoked",
    scopes: k.scopes,
    createdAt: k.createdAt.toISOString(),
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
  }));

  return {
    credits,
    usageEvents,
    breakdownByAction,
    publicApiUsageCount,
    creditsSpentLast7d,
    creditsSpentLast30d,
    apiKeys,
  };
}
