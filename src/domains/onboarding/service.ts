import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function getProjectSetupStatus(projectId: string) {
  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, projectId) });
  if (!project) throw new Error("Project not found");

  const cycle = await db.query.strategyCycles.findFirst({
    where: eq(schema.strategyCycles.projectId, projectId),
    orderBy: [desc(schema.strategyCycles.createdAt)],
  });
  const posts = cycle
    ? await db.query.contentItems.findMany({ where: eq(schema.contentItems.strategyCycleId, cycle.id) })
    : [];

  const postIds = posts.map((post) => post.id);
  const assets =
    postIds.length > 0
      ? await db.query.contentAssets.findMany({
          where: inArray(schema.contentAssets.contentItemId, postIds),
        })
      : [];

  const hasPublishedOrScheduled = posts.some((post) => ["scheduled", "published"].includes(post.publishStatus));
  const hasTracking = posts.length > 0 && posts.every((post) => !!post.trackingSlug);

  return {
    onboardingComplete: !!project.name && !!project.productName && !!project.ctaUrl,
    strategyGenerated: !!cycle,
    postsGenerated: posts.length > 0,
    rendered: assets.some((asset) => asset.assetType === "video") || posts.some((post) => post.renderStatus === "completed"),
    publishFlowConfigured: hasPublishedOrScheduled,
    trackingActive: hasTracking,
  };
}

export async function getProductReadinessSummary(projectId: string) {
  const setup = await getProjectSetupStatus(projectId);
  const checks = Object.values(setup);
  const passed = checks.filter(Boolean).length;
  return {
    ...setup,
    score: `${passed}/${checks.length}`,
    isReady: passed >= 4,
  };
}
