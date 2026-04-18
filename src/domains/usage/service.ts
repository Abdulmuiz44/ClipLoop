import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getPlanLimitsForUser } from "@/domains/account/service";

type CounterKey = "postsGenerated" | "manualRegenerations" | "videosRendered" | "postsPublished";
type PeriodType = "week" | "month";
type Period = { periodType: PeriodType; periodStart: Date; periodEnd: Date };

function getWeekPeriod(date = new Date()): Period {
  const day = date.getUTCDay();
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - day);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { periodType: "week", periodStart: start, periodEnd: end };
}

function getMonthPeriod(date = new Date()): Period {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return { periodType: "month", periodStart: start, periodEnd: end };
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
      eq(schema.usageCounters.periodType, period.periodType),
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
      periodType: period.periodType,
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

async function getAggregatePublished(userId: string) {
  const target = getMonthPeriod();
  const rows = await db
    .select({
      postsPublished: sql<number>`coalesce(sum(${schema.usageCounters.postsPublished}), 0)`,
    })
    .from(schema.usageCounters)
    .where(
      and(
        eq(schema.usageCounters.userId, userId),
        eq(schema.usageCounters.periodType, target.periodType),
        eq(schema.usageCounters.periodStart, target.periodStart),
        eq(schema.usageCounters.periodEnd, target.periodEnd),
      ),
    );

  return rows[0] ?? { postsPublished: 0 };
}

export async function assertProjectCreationAllowed(userId: string) {
  const limits = await getPlanLimitsForUser(userId);
  const count = await db.$count(
    schema.projects,
    and(eq(schema.projects.userId, userId), eq(schema.projects.status, "active")),
  );
  if (count >= limits.activeProjects) {
    if (limits.activeProjects <= 1) {
      throw new UsageLimitError(
        "You can create 1 project on the free plan. Upgrade to create more projects.",
        "PROJECT_LIMIT_REACHED",
        limits.activeProjects,
        count,
      );
    }
    throw new UsageLimitError("Project limit reached for your current plan.", "PROJECT_LIMIT_REACHED", limits.activeProjects, count);
  }
}

export async function assertPublishAllowed(userId: string, count: number) {
  const limits = await getPlanLimitsForUser(userId);
  const monthly = await getAggregatePublished(userId);
  if (monthly.postsPublished + count > limits.publishesPerMonth) {
    throw new UsageLimitError(
      "Monthly publish limit reached.",
      "PUBLISH_MONTHLY_LIMIT_REACHED",
      limits.publishesPerMonth,
      monthly.postsPublished,
    );
  }
}
