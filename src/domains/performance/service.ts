import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { listContentItemsForStrategyCycle } from "@/domains/content-items/service";

function classifyByRank(scores: Array<{ contentItemId: string; score: number }>) {
  if (scores.length < 3) {
    return new Map(scores.map((item) => [item.contentItemId, null]));
  }

  const map = new Map<string, "winner" | "neutral" | "loser">();
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const topCutoff = Math.max(1, Math.floor(sorted.length / 3));
  const bottomStart = sorted.length - topCutoff;

  sorted.forEach((item, index) => {
    if (index < topCutoff) map.set(item.contentItemId, "winner");
    else if (index >= bottomStart) map.set(item.contentItemId, "loser");
    else map.set(item.contentItemId, "neutral");
  });

  return map;
}

export async function rollupPerformanceForContentItem(contentItemId: string) {
  const contentItem = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
  if (!contentItem) throw new Error("Content item not found");

  const clicks = await db.$count(schema.clickEvents, eq(schema.clickEvents.contentItemId, contentItemId));
  const signups = await db.$count(
    schema.conversionEvents,
    and(eq(schema.conversionEvents.contentItemId, contentItemId), eq(schema.conversionEvents.eventType, "signup")),
  );

  const revenueRows = await db.query.revenueEvents.findMany({ where: eq(schema.revenueEvents.contentItemId, contentItemId) });
  const revenue = revenueRows.reduce((sum, row) => sum + row.amount, 0);

  const views = 0;
  const ctr = 0;
  const epc = clicks > 0 ? revenue / clicks : 0;
  const score = revenue * 100 + signups * 20 + clicks * 2 + ctr * 5;

  const existing = await db.query.performanceMetrics.findFirst({
    where: eq(schema.performanceMetrics.contentItemId, contentItemId),
  });

  if (existing) {
    const [updated] = await db
      .update(schema.performanceMetrics)
      .set({
        views,
        clicks,
        signups,
        revenue,
        ctr: Math.round(ctr),
        epc: Math.round(epc),
        score: Math.round(score),
        lastCalculatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.performanceMetrics.id, existing.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(schema.performanceMetrics)
    .values({
      projectId: contentItem.projectId,
      contentItemId,
      views,
      clicks,
      signups,
      revenue,
      ctr: Math.round(ctr),
      epc: Math.round(epc),
      score: Math.round(score),
      lastCalculatedAt: new Date(),
    })
    .returning();

  return created;
}

export async function rollupPerformanceForStrategyCycle(strategyCycleId: string) {
  const items = await listContentItemsForStrategyCycle(strategyCycleId);
  const rolled = [];

  for (const item of items) {
    rolled.push(await rollupPerformanceForContentItem(item.id));
  }

  const classifications = classifyByRank(rolled.map((metric) => ({ contentItemId: metric.contentItemId, score: metric.score })));

  for (const metric of rolled) {
    await db
      .update(schema.performanceMetrics)
      .set({ classification: classifications.get(metric.contentItemId) ?? null, updatedAt: new Date() })
      .where(eq(schema.performanceMetrics.id, metric.id));
  }

  const refreshed = await getPerformanceForStrategyCycle(strategyCycleId);

  return {
    strategyCycleId,
    itemCount: refreshed.length,
    totalClicks: refreshed.reduce((sum, row) => sum + row.clicks, 0),
    totalSignups: refreshed.reduce((sum, row) => sum + row.signups, 0),
    totalRevenue: refreshed.reduce((sum, row) => sum + row.revenue, 0),
    metrics: refreshed,
  };
}

export async function getPerformanceForStrategyCycle(strategyCycleId: string) {
  const items = await listContentItemsForStrategyCycle(strategyCycleId);
  const ids = new Set(items.map((item) => item.id));

  const metrics = await db.query.performanceMetrics.findMany({
    orderBy: [desc(schema.performanceMetrics.score)],
  });

  return metrics.filter((metric) => ids.has(metric.contentItemId));
}

export async function rollupPerformanceForProject(projectId: string) {
  const items = await db.query.contentItems.findMany({ where: eq(schema.contentItems.projectId, projectId) });
  for (const item of items) {
    await rollupPerformanceForContentItem(item.id);
  }

  const metrics = await db.query.performanceMetrics.findMany({ where: eq(schema.performanceMetrics.projectId, projectId) });

  return {
    projectId,
    totalClicks: metrics.reduce((sum, row) => sum + row.clicks, 0),
    totalSignups: metrics.reduce((sum, row) => sum + row.signups, 0),
    totalRevenue: metrics.reduce((sum, row) => sum + row.revenue, 0),
    topScore: metrics.length ? Math.max(...metrics.map((row) => row.score)) : 0,
  };
}

export async function getProjectPerformanceTotals(projectId: string) {
  const metrics = await db.query.performanceMetrics.findMany({ where: eq(schema.performanceMetrics.projectId, projectId) });
  return {
    projectId,
    totalClicks: metrics.reduce((sum, row) => sum + row.clicks, 0),
    totalSignups: metrics.reduce((sum, row) => sum + row.signups, 0),
    totalRevenue: metrics.reduce((sum, row) => sum + row.revenue, 0),
    topScore: metrics.length ? Math.max(...metrics.map((row) => row.score)) : 0,
  };
}
