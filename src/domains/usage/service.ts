import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getPlanLimitsForUser } from "@/domains/account/service";

type CounterKey = "postsGenerated" | "manualRegenerations" | "videosRendered" | "postsPublished";

type Period = { periodStart: string; periodEnd: string };

function getWeekPeriod(date = new Date()): Period {
  const day = date.getUTCDay();
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - day);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { periodStart: start.toISOString().slice(0, 10), periodEnd: end.toISOString().slice(0, 10) };
}

function getMonthPeriod(date = new Date()): Period {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return { periodStart: start.toISOString().slice(0, 10), periodEnd: end.toISOString().slice(0, 10) };
}

export class UsageLimitError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly limit: number,
    public readonly used: number,
  ) {
    super(message);
  }
}

export async function getOrCreateUsageCounter(userId: string, projectId: string | null, period: Period) {
  const existing = await db.query.usageCounters.findFirst({
    where: and(
      eq(schema.usageCounters.userId, userId),
      projectId ? eq(schema.usageCounters.projectId, projectId) : sql`${schema.usageCounters.projectId} is null`,
      eq(schema.usageCounters.periodStart, period.periodStart),
      eq(schema.usageCounters.periodEnd, period.periodEnd),
    ),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(schema.usageCounters)
    .values({
      userId,
      projectId,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
    })
    .returning();

  return created;
}

export async function incrementUsageCounter(params: {
  userId: string;
  projectId?: string | null;
  period: "week" | "month";
  field: CounterKey;
  amount?: number;
}) {
  const period = params.period === "week" ? getWeekPeriod() : getMonthPeriod();
  const counter = await getOrCreateUsageCounter(params.userId, params.projectId ?? null, period);
  const amount = params.amount ?? 1;
  const next = (counter[params.field] ?? 0) + amount;

  await db
    .update(schema.usageCounters)
    .set({ [params.field]: next, updatedAt: new Date() })
    .where(eq(schema.usageCounters.id, counter.id));
}

async function getAggregate(userId: string, period: "week" | "month") {
  const target = period === "week" ? getWeekPeriod() : getMonthPeriod();
  const rows = await db
    .select({
      postsGenerated: sql<number>`coalesce(sum(${schema.usageCounters.postsGenerated}), 0)`,
      manualRegenerations: sql<number>`coalesce(sum(${schema.usageCounters.manualRegenerations}), 0)`,
      videosRendered: sql<number>`coalesce(sum(${schema.usageCounters.videosRendered}), 0)`,
      postsPublished: sql<number>`coalesce(sum(${schema.usageCounters.postsPublished}), 0)`,
    })
    .from(schema.usageCounters)
    .where(
      and(
        eq(schema.usageCounters.userId, userId),
        gte(schema.usageCounters.periodStart, target.periodStart),
        lte(schema.usageCounters.periodEnd, target.periodEnd),
      ),
    );

  return rows[0] ?? { postsGenerated: 0, manualRegenerations: 0, videosRendered: 0, postsPublished: 0 };
}

export async function assertProjectCreationAllowed(userId: string) {
  const limits = await getPlanLimitsForUser(userId);
  const count = await db.$count(schema.projects, eq(schema.projects.userId, userId));
  if (count >= limits.activeProjects) {
    throw new UsageLimitError("Project limit reached for your current plan.", "PROJECT_LIMIT_REACHED", limits.activeProjects, count);
  }
}

export async function assertPostGenerationAllowed(userId: string, count: number) {
  const limits = await getPlanLimitsForUser(userId);
  const weekly = await getAggregate(userId, "week");
  const monthly = await getAggregate(userId, "month");

  if (weekly.postsGenerated + count > limits.postsPerWeek) {
    throw new UsageLimitError(
      "Weekly post generation limit reached.",
      "POSTS_WEEKLY_LIMIT_REACHED",
      limits.postsPerWeek,
      weekly.postsGenerated,
    );
  }

  if (monthly.postsGenerated + count > limits.postsPerMonth) {
    throw new UsageLimitError(
      "Monthly post generation limit reached.",
      "POSTS_MONTHLY_LIMIT_REACHED",
      limits.postsPerMonth,
      monthly.postsGenerated,
    );
  }
}

export async function assertManualRegenerationAllowed(userId: string) {
  const limits = await getPlanLimitsForUser(userId);
  const weekly = await getAggregate(userId, "week");
  if (weekly.manualRegenerations + 1 > limits.manualRegenerationsPerWeek) {
    throw new UsageLimitError(
      "Weekly manual regeneration limit reached.",
      "REGEN_WEEKLY_LIMIT_REACHED",
      limits.manualRegenerationsPerWeek,
      weekly.manualRegenerations,
    );
  }
}

export async function assertRenderAllowed(userId: string, count: number) {
  const limits = await getPlanLimitsForUser(userId);
  const monthly = await getAggregate(userId, "month");
  if (monthly.videosRendered + count > limits.rendersPerMonth) {
    throw new UsageLimitError(
      "Monthly render limit reached.",
      "RENDER_MONTHLY_LIMIT_REACHED",
      limits.rendersPerMonth,
      monthly.videosRendered,
    );
  }
}

export async function assertPublishAllowed(userId: string, count: number) {
  const limits = await getPlanLimitsForUser(userId);
  const monthly = await getAggregate(userId, "month");
  if (monthly.postsPublished + count > limits.publishesPerMonth) {
    throw new UsageLimitError(
      "Monthly publish limit reached.",
      "PUBLISH_MONTHLY_LIMIT_REACHED",
      limits.publishesPerMonth,
      monthly.postsPublished,
    );
  }
}
