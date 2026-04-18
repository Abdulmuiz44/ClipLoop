import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { getLatestSubscriptionForUser, subscriptionConfersStarterAccess } from "@/domains/billing/service";
import { OFFLINE_DEMO_USER_ID } from "@/lib/auth";

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
  constructor(message = "ClipLoop access is currently unavailable for this account.") {
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
      fullName: "ClipLoop Demo User",
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
    postsPerWeek: weekly[0]?.postsGenerated ?? 0,
    postsPerMonth: monthly[0]?.postsGenerated ?? 0,
    manualRegenerationsPerWeek: weekly[0]?.manualRegenerations ?? 0,
    rendersPerMonth: monthly[0]?.videosRendered ?? 0,
    publishesPerMonth: monthly[0]?.postsPublished ?? 0,
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
