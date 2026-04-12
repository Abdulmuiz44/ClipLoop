import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { generateStructuredObject } from "@/lib/llm";
import { postGenerationPrompt, regeneratePostPrompt } from "@/lib/prompts/templates";
import { PROMPT_VERSIONS } from "@/lib/prompts/versions";
import { postBatchOutputSchema, singlePostOutputSchema } from "@/lib/validation/content";
import { buildTrackingSlug } from "@/lib/utils/slugs";
import { assertManualRegenerationAllowed, assertPostGenerationAllowed, incrementUsageCounter } from "@/domains/usage/service";

export async function listContentItemsForStrategyCycle(strategyCycleId: string) {
  const rows = await db.query.contentItems.findMany({
    where: eq(schema.contentItems.strategyCycleId, strategyCycleId),
    orderBy: [desc(schema.contentItems.createdAt)],
  });

  const latestByRoot = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const rootKey = row.parentContentItemId ?? row.id;
    if (!latestByRoot.has(rootKey)) {
      latestByRoot.set(rootKey, row);
    }
  }

  return Array.from(latestByRoot.values()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function generatePostsForStrategyCycle(strategyCycleId: string) {
  const strategyCycle = await db.query.strategyCycles.findFirst({ where: eq(schema.strategyCycles.id, strategyCycleId) });
  if (!strategyCycle) throw new Error("Strategy cycle not found");

  const existing = await listContentItemsForStrategyCycle(strategyCycleId);
  if (existing.length >= 5) {
    return existing;
  }

  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, strategyCycle.projectId) });
  if (!project) throw new Error("Project not found");
  await assertPostGenerationAllowed(project.userId, 5);

  const structured = await generateStructuredObject({
    schema: postBatchOutputSchema,
    prompt: postGenerationPrompt(
      {
        name: project.name,
        productName: project.productName,
        oneLiner: project.oneLiner,
        description: project.description,
        audience: project.audience,
        niche: project.niche,
        offer: project.offer,
        websiteUrl: project.websiteUrl,
        ctaUrl: project.ctaUrl,
        goalType: project.goalType,
        voiceStyleNotes: (project.voicePrefsJson as { style_notes?: string } | null)?.style_notes,
        examplePosts: (project.examplePostsJson as string[] | null) ?? [],
      },
      {
        strategy_summary: strategyCycle.strategySummary ?? "",
        angles: (strategyCycle.anglesJson as any[]) as any,
      },
    ),
    mockFactory: () => ({
      posts: Array.from({ length: 5 }).map((_, idx) => ({
        internal_title: `Post ${idx + 1}: ${project.productName} result`,
        hook: `Still doing ${project.niche} the hard way?`,
        slides: [
          `Problem: ${project.audience} loses time`,
          `Shift: Use ${project.productName} to automate`,
          `Proof: Faster output in one weekly loop`,
          `CTA: Try it this week`,
        ],
        caption: `${project.productName} helps ${project.audience} move from idea to content drafts every week.`,
        cta_text: "Start your weekly pack",
        hashtags: ["#saas", "#buildinpublic", "#growth"],
        why_it_should_work: "Pain-led hook plus clear proof and CTA",
      })),
    }),
  });

  const inserted = await db
    .insert(schema.contentItems)
    .values(
      structured.posts.map((post, idx) => ({
        projectId: project.id,
        strategyCycleId,
        platform: "instagram",
        contentType: "slideshow_video",
        internalTitle: post.internal_title,
        angle: `angle-${idx + 1}`,
        hook: post.hook,
        slidesJson: post.slides,
        caption: post.caption,
        hashtagsJson: post.hashtags,
        ctaText: post.cta_text,
        destinationUrl: project.ctaUrl,
        trackingSlug: buildTrackingSlug(project.productName, `${strategyCycleId}-${idx + 1}`),
        templateId: "clean_dark",
        renderStatus: "pending",
        publishStatus: "draft",
      })),
    )
    .returning();

  await incrementUsageCounter({ userId: project.userId, projectId: project.id, period: "week", field: "postsGenerated", amount: inserted.length });
  await incrementUsageCounter({
    userId: project.userId,
    projectId: project.id,
    period: "month",
    field: "postsGenerated",
    amount: inserted.length,
  });

  return inserted;
}

export async function regenerateSingleContentItem(contentItemId: string) {
  const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
  if (!item) throw new Error("Content item not found");

  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, item.projectId) });
  if (!project) throw new Error("Project not found");
  await assertManualRegenerationAllowed(project.userId);

  const structured = await generateStructuredObject({
    schema: singlePostOutputSchema,
    prompt: regeneratePostPrompt(
      {
        internal_title: item.internalTitle,
        hook: item.hook,
        slides: (item.slidesJson as string[]) ?? [],
        caption: item.caption,
        cta_text: item.ctaText,
        hashtags: (item.hashtagsJson as string[]) ?? [],
        why_it_should_work: "",
      },
      "Improve hook freshness",
    ),
    mockFactory: () => ({
      post: {
        internal_title: `${item.internalTitle} (Regenerated)`,
        hook: `${item.hook} Here is a sharper angle.`,
        slides: [
          "Pain: growth feels random",
          `Fix: use ${project.productName} each week`,
          "Result: 5 drafts with one click",
          "CTA: generate your pack now",
        ],
        caption: `${project.productName} now with a refreshed hook and clearer proof line.`,
        cta_text: item.ctaText,
        hashtags: ["#saas", "#contentstrategy", "#marketing"],
        why_it_should_work: "Sharper hook and cleaner value prop",
      },
    }),
  });

  const [regenerated] = await db
    .insert(schema.contentItems)
    .values({
      projectId: item.projectId,
      strategyCycleId: item.strategyCycleId,
      parentContentItemId: item.parentContentItemId ?? item.id,
      platform: item.platform,
      contentType: item.contentType,
      internalTitle: structured.post.internal_title,
      angle: item.angle,
      hook: structured.post.hook,
      slidesJson: structured.post.slides,
      caption: structured.post.caption,
      hashtagsJson: structured.post.hashtags,
      ctaText: structured.post.cta_text,
      destinationUrl: item.destinationUrl,
      trackingSlug: buildTrackingSlug(project.productName, `regen-${item.id}`),
      templateId: "clean_dark",
      renderStatus: "pending",
      publishStatus: "draft",
    })
    .returning();

  await incrementUsageCounter({ userId: project.userId, projectId: project.id, period: "week", field: "manualRegenerations", amount: 1 });
  return regenerated;
}
