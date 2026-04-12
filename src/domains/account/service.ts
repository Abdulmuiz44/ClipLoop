import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";

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

const NO_ACCESS_LIMITS: PlanLimits = {
  activeProjects: 0,
  postsPerWeek: 0,
  postsPerMonth: 0,
  manualRegenerationsPerWeek: 0,
  rendersPerMonth: 0,
  publishesPerMonth: 0,
  connectedChannels: 0,
};

const STARTER_LIMITS: PlanLimits = {
  activeProjects: 1,
  postsPerWeek: 5,
  postsPerMonth: 20,
  manualRegenerationsPerWeek: 3,
  rendersPerMonth: 20,
  publishesPerMonth: 20,
  connectedChannels: 1,
};

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: NO_ACCESS_LIMITS,
  starter: STARTER_LIMITS,
  beta: STARTER_LIMITS,
};

export class ProductAccessError extends Error {
  constructor(message = "ClipLoop is currently invite-only. Request beta access to continue.") {
    super(message);
  }
}

export async function getSubscriptionForUser(userId: string) {
  return db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, userId),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });
}

export async function getUserPlanState(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (!user) throw new Error("User not found");

  const subscription = await getSubscriptionForUser(userId);
  const hasActiveSubscription = !!subscription && ["trialing", "active"].includes(subscription.status);

  const effectivePlan: PlanType = hasActiveSubscription ? "starter" : (user.plan as PlanType);
  const billingStatus = subscription?.status ?? user.billingStatus ?? (effectivePlan === "starter" ? "active" : "none");

  return {
    user,
    subscription,
    effectivePlan,
    billingStatus,
    isBetaApproved: user.isBetaApproved,
    inviteOnlyMode: env.INVITE_ONLY_MODE,
  };
}

export function canAccessProductFromState(state: Awaited<ReturnType<typeof getUserPlanState>>) {
  if (env.MOCK_MODE && state.user.email === env.DEMO_USER_EMAIL) {
    return true;
  }

  if (!state.inviteOnlyMode) {
    return true;
  }

  return state.isBetaApproved || state.effectivePlan === "starter";
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
  if (!(await canAccessProduct(userId))) {
    return NO_ACCESS_LIMITS;
  }

  return PLAN_LIMITS[state.effectivePlan] ?? NO_ACCESS_LIMITS;
}

export async function getCurrentUsageSummary(userId: string) {
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
          gte(schema.usageCounters.periodStart, weekStart.toISOString().slice(0, 10)),
          lte(schema.usageCounters.periodEnd, weekEnd.toISOString().slice(0, 10)),
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
          gte(schema.usageCounters.periodStart, monthStart.toISOString().slice(0, 10)),
          lte(schema.usageCounters.periodEnd, monthEnd.toISOString().slice(0, 10)),
        ),
      ),
  ]);

  return {
    limits,
    usage: {
      postsPerWeek: weekly[0]?.postsGenerated ?? 0,
      postsPerMonth: monthly[0]?.postsGenerated ?? 0,
      manualRegenerationsPerWeek: weekly[0]?.manualRegenerations ?? 0,
      rendersPerMonth: monthly[0]?.videosRendered ?? 0,
      publishesPerMonth: monthly[0]?.postsPublished ?? 0,
    },
  };
}
