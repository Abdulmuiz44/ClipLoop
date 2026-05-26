import { and, eq, sql } from "drizzle-orm";

import { db, schema } from "@/lib/db";
import { getPlanLimitsForUser } from "@/domains/account/service";

export async function getCurrentUsageSummaryForPublicApi(input: { userId: string; projectId: string | null }) {
  const limits = await getPlanLimitsForUser(input.userId);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - now.getUTCDay());
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));

  const projectFilter = input.projectId ? eq(schema.usageCounters.projectId, input.projectId) : sql`true`;

  const [weekly, monthly] = await Promise.all([
    db
      .select({
        postsGenerated: sql<number>`coalesce(sum(${schema.usageCounters.postsGenerated}), 0)`,
        manualRegenerations: sql<number>`coalesce(sum(${schema.usageCounters.manualRegenerations}), 0)`,
      })
      .from(schema.usageCounters)
      .where(
        and(
          eq(schema.usageCounters.userId, input.userId),
          eq(schema.usageCounters.periodType, "week"),
          eq(schema.usageCounters.periodStart, weekStart),
          eq(schema.usageCounters.periodEnd, weekEnd),
          projectFilter,
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
          eq(schema.usageCounters.userId, input.userId),
          eq(schema.usageCounters.periodType, "month"),
          eq(schema.usageCounters.periodStart, monthStart),
          eq(schema.usageCounters.periodEnd, monthEnd),
          projectFilter,
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
    projectId: input.projectId,
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
