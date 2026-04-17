import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { generateStructuredObject } from "@/lib/llm";
import { iterationAnalysisPrompt, iterationNextPackPrompt } from "@/lib/prompts/templates";
import { PROMPT_VERSIONS } from "@/lib/prompts/versions";
import { iterationAnalysisSchema } from "@/lib/validation/iteration";
import { postBatchOutputSchema } from "@/lib/validation/content";
import { getPerformanceForStrategyCycle, rollupPerformanceForStrategyCycle } from "@/domains/performance/service";
import { buildTrackingSlug } from "@/lib/utils/slugs";
import {
  defaultPublishStrategyForChannel,
  normalizeProjectChannels,
  pickDeterministicChannel,
  resolveContentItemTargetChannel,
  type ProjectChannel,
} from "@/lib/utils/channels";

function buildIterationChannelCaptions(input: {
  channels: ProjectChannel[];
  name: string;
  offer: string;
  cta: string;
}): Partial<Record<ProjectChannel, string>> {
  const variants: Partial<Record<ProjectChannel, string>> = {};
  for (const channel of input.channels) {
    if (channel === "instagram") variants[channel] = `${input.name}: ${input.offer}. ${input.cta}`;
    if (channel === "tiktok") variants[channel] = `${input.offer}. ${input.cta}`;
    if (channel === "whatsapp") variants[channel] = `${input.offer} - ${input.cta}`;
  }
  return variants;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function pickFallbackWinners(items: Array<{ id: string; score: number }>) {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  return sorted.slice(0, Math.min(2, sorted.length)).map((row) => row.id);
}

export async function createIterationExperiments(strategyCycleId: string, analysis: ReturnType<typeof iterationAnalysisSchema.parse>) {
  const cycle = await db.query.strategyCycles.findFirst({ where: eq(schema.strategyCycles.id, strategyCycleId) });
  if (!cycle) throw new Error("Strategy cycle not found");

  const rows = [
    {
      projectId: cycle.projectId,
      strategyCycleId,
      winnerContentItemId: null,
      hypothesis: "Cycle-level summary of what won/lost",
      mutationType: "structure" as const,
      inputSummary: analysis.summary,
      resultSummary: JSON.stringify({ losers: analysis.losers, angles_to_stop: analysis.angles_to_stop }),
      status: "generated" as const,
      metadataJson: { promptVersion: PROMPT_VERSIONS.iterationAnalysis, type: "summary" },
    },
    ...analysis.improved_hooks.map((hook) => ({
      projectId: cycle.projectId,
      strategyCycleId,
      winnerContentItemId: analysis.winners[0]?.content_item_id ?? null,
      hypothesis: "Improved hook phrasing from winners should lift response",
      mutationType: "hook" as const,
      inputSummary: hook,
      resultSummary: null,
      status: "generated" as const,
      metadataJson: { promptVersion: PROMPT_VERSIONS.iterationAnalysis },
    })),
    ...analysis.angle_mutations.map((mutation) => ({
      projectId: cycle.projectId,
      strategyCycleId,
      winnerContentItemId: mutation.based_on_content_item_id,
      hypothesis: mutation.why,
      mutationType: "angle" as const,
      inputSummary: mutation.new_angle,
      resultSummary: null,
      status: "generated" as const,
      metadataJson: { promptVersion: PROMPT_VERSIONS.iterationAnalysis },
    })),
    ...analysis.losers.map((loser) => ({
      projectId: cycle.projectId,
      strategyCycleId,
      winnerContentItemId: loser.content_item_id,
      hypothesis: loser.reason_it_failed,
      mutationType: "structure" as const,
      inputSummary: loser.reason_it_failed,
      resultSummary: "Avoid repeating this pattern",
      status: "generated" as const,
      metadataJson: { promptVersion: PROMPT_VERSIONS.iterationAnalysis, type: "loser" },
    })),
  ];

  if (rows.length === 0) return [];
  return db.insert(schema.iterationExperiments).values(rows).returning();
}

export async function getIterationExperimentsForStrategyCycle(strategyCycleId: string) {
  return db.query.iterationExperiments.findMany({
    where: eq(schema.iterationExperiments.strategyCycleId, strategyCycleId),
  });
}

export async function analyzeStrategyCyclePerformance(strategyCycleId: string) {
  const cycle = await db.query.strategyCycles.findFirst({ where: eq(schema.strategyCycles.id, strategyCycleId) });
  if (!cycle) throw new Error("Strategy cycle not found");

  await rollupPerformanceForStrategyCycle(strategyCycleId);

  const contentItems = await db.query.contentItems.findMany({
    where: eq(schema.contentItems.strategyCycleId, strategyCycleId),
  });

  const performance = await getPerformanceForStrategyCycle(strategyCycleId);
  const performanceRows = performance.map((row) => ({
    contentItemId: row.contentItemId,
    score: row.score,
    clicks: row.clicks,
    signups: row.signups,
    revenue: row.revenue,
    classification: row.classification,
  }));

  const winnersByPerf = performance.filter((row) => row.classification === "winner").map((row) => row.contentItemId);
  const fallbackWinners = pickFallbackWinners(performance.map((row) => ({ id: row.contentItemId, score: row.score })));
  const selectedWinners = winnersByPerf.length ? winnersByPerf : fallbackWinners;

  const analysis = await generateStructuredObject({
    schema: iterationAnalysisSchema,
    prompt: iterationAnalysisPrompt({
      strategyCycleId,
      performanceRows,
      contentSummaries: contentItems.map((item) => ({
        contentItemId: item.id,
        hook: item.hook,
        angle: item.angle,
        ctaText: item.ctaText,
      })),
    }),
    mockFactory: () => {
      const winners = contentItems
        .filter((item) => selectedWinners.includes(item.id))
        .slice(0, 3)
        .map((item, idx) => ({
          content_item_id: item.id,
          reason_it_worked: `Post ${idx + 1} matched audience pain and drove action with a clear CTA.`,
          pattern: "pain-to-proof-to-cta",
        }));

      const losers = contentItems
        .filter((item) => !selectedWinners.includes(item.id))
        .slice(0, 2)
        .map((item) => ({
          content_item_id: item.id,
          reason_it_failed: "Hook was too generic and lacked concrete proof.",
        }));

      return {
        summary: "Top performers combined specific pain framing, concrete proof, and direct CTA.",
        winners,
        losers,
        improved_hooks: winners.map((winner, idx) => `Hook variant ${idx + 1}: specific pain + measurable payoff`),
        angle_mutations: winners.map((winner, idx) => ({
          based_on_content_item_id: winner.content_item_id,
          new_angle: `Mutation ${idx + 1}: tighter outcome with urgency`,
          why: "This keeps the winning structure while increasing clarity and urgency.",
        })),
        angles_to_stop: losers.map(() => "Broad generic productivity angle"),
      };
    },
  });

  const experiments = await createIterationExperiments(strategyCycleId, analysis);

  return {
    strategyCycleId,
    analysis,
    experiments,
  };
}

export async function getNextStrategyCycle(projectId: string, sourceStrategyCycleId: string) {
  const source = await db.query.strategyCycles.findFirst({
    where: and(eq(schema.strategyCycles.id, sourceStrategyCycleId), eq(schema.strategyCycles.projectId, projectId)),
  });
  if (!source) return null;

  const nextWeekStart = addDays(source.weekStart, 7);

  return db.query.strategyCycles.findFirst({
    where: and(
      eq(schema.strategyCycles.projectId, projectId),
      eq(schema.strategyCycles.source, "iteration"),
      eq(schema.strategyCycles.weekStart, nextWeekStart),
    ),
  });
}

export async function generateNextStrategyCycleFromResults(strategyCycleId: string) {
  const sourceCycle = await db.query.strategyCycles.findFirst({ where: eq(schema.strategyCycles.id, strategyCycleId) });
  if (!sourceCycle) throw new Error("Source strategy cycle not found");

  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, sourceCycle.projectId) });
  if (!project) throw new Error("Project not found");

  const existing = await getNextStrategyCycle(project.id, sourceCycle.id);
  if (existing) return existing;

  const { analysis } = await analyzeStrategyCyclePerformance(strategyCycleId);

  const nextWeekStart = addDays(sourceCycle.weekStart, 7);
  const nextWeekEnd = addDays(nextWeekStart, 6);

  const [nextCycle] = await db
    .insert(schema.strategyCycles)
    .values({
      projectId: project.id,
      weekStart: nextWeekStart,
      weekEnd: nextWeekEnd,
      source: "iteration",
      strategySummary: analysis.summary,
      anglesJson: analysis.angle_mutations,
      llmProvider: "mock",
      llmModel: "mock-deterministic",
      promptVersion: PROMPT_VERSIONS.iterationAnalysis,
      status: "ready",
    })
    .returning();

  return nextCycle;
}

export async function generateNextContentPackFromIteration(
  nextStrategyCycleId: string,
  analysis: ReturnType<typeof iterationAnalysisSchema.parse>,
) {
  const cycle = await db.query.strategyCycles.findFirst({ where: eq(schema.strategyCycles.id, nextStrategyCycleId) });
  if (!cycle) throw new Error("Next strategy cycle not found");

  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, cycle.projectId) });
  if (!project) throw new Error("Project not found");
  const preferredChannels = normalizeProjectChannels(project.preferredChannelsJson, project.preferredChannels);
  const winnerIds = analysis.winners.map((winner) => winner.content_item_id);
  const sourceCycleItems =
    winnerIds.length > 0
      ? await db.query.contentItems.findMany({
          where: inArray(schema.contentItems.id, winnerIds),
        })
      : [];
  const sourceItemById = new Map(sourceCycleItems.map((row) => [row.id, row]));

  const payload = await generateStructuredObject({
    schema: postBatchOutputSchema,
    prompt: iterationNextPackPrompt({
      analysis,
      productName: project.businessName ?? project.productName,
      projectType: project.projectType,
      audience: project.targetAudience ?? project.audience,
      primaryOffer: project.primaryOffer ?? project.offer,
      tone: project.tone,
      callToAction: project.callToAction,
      preferredChannels,
      languageStyle: project.languageStyle,
    }),
    mockFactory: () => ({
      posts: Array.from({ length: 5 }).map((_, idx) => ({
        internal_title: `Next Week Post ${idx + 1}`,
        hook: analysis.improved_hooks[idx % Math.max(analysis.improved_hooks.length, 1)] ?? `Improved hook ${idx + 1}`,
        slides: [
          `Pain point for ${project.targetAudience ?? project.audience}`,
          `Mutation insight: ${analysis.angle_mutations[idx % Math.max(analysis.angle_mutations.length, 1)]?.new_angle ?? "new angle"}`,
          `Proof: local buyer response and offer pull`,
          `CTA: ${project.callToAction ?? project.ctaUrl}`,
        ],
        caption: `Next-cycle variant informed by winners for ${project.businessName ?? project.productName}.`,
        channel_captions: buildIterationChannelCaptions({
          channels: preferredChannels,
          name: project.businessName ?? project.productName,
          offer: project.primaryOffer ?? project.offer,
          cta: project.callToAction ?? "Try this offer now",
        }),
        cta_text: project.callToAction ?? "Try this offer now",
        channel_cta_text: buildIterationChannelCaptions({
          channels: preferredChannels,
          name: project.businessName ?? project.productName,
          offer: project.primaryOffer ?? project.offer,
          cta: project.callToAction ?? "Try this offer now",
        }),
        hashtags: ["#nigeriabusiness", "#shortform", "#iteration"],
        why_it_should_work: "Derived from winner patterns with clearer local offer and CTA.",
      })),
    }),
  });

  const newContentItems: typeof schema.contentItems.$inferInsert[] = payload.posts.map((post, idx) => {
    const targetChannel = (() => {
      const winnerId = analysis.winners[idx % Math.max(analysis.winners.length, 1)]?.content_item_id;
      if (!winnerId) return pickDeterministicChannel(preferredChannels, idx);
      const source = sourceItemById.get(winnerId);
      if (!source) return pickDeterministicChannel(preferredChannels, idx);
      return resolveContentItemTargetChannel(source.targetChannel, source.platform);
    })();
    return {
    targetChannel,
    publishStrategy: defaultPublishStrategyForChannel(targetChannel),
    projectId: project.id,
    strategyCycleId: nextStrategyCycleId,
    parentContentItemId: analysis.winners[idx % Math.max(analysis.winners.length, 1)]?.content_item_id ?? null,
    platform: "instagram",
    contentType: "slideshow_video",
    internalTitle: post.internal_title,
    angle: analysis.angle_mutations[idx % Math.max(analysis.angle_mutations.length, 1)]?.new_angle ?? `iteration-angle-${idx + 1}`,
    hook: post.hook,
    slidesJson: post.slides,
    caption: post.caption,
    channelCaptionsJson: post.channel_captions ?? {},
    hashtagsJson: post.hashtags,
    ctaText: post.cta_text,
    channelCtaTextJson: post.channel_cta_text ?? {},
    destinationUrl: project.ctaUrl,
    trackingSlug: buildTrackingSlug(project.productName, `iter-${nextStrategyCycleId}-${idx + 1}`),
    templateId: "clean_dark",
    renderStatus: "pending",
    publishStatus: "draft",
    };
  });

  const inserted = await db
    .insert(schema.contentItems)
    .values(newContentItems)
    .returning();

  return inserted;
}

export async function generateNextFromCycle(strategyCycleId: string) {
  const source = await db.query.strategyCycles.findFirst({ where: eq(schema.strategyCycles.id, strategyCycleId) });
  if (!source) throw new Error("Source cycle not found");

  const analysisResult = await analyzeStrategyCyclePerformance(strategyCycleId);
  const nextCycle = await generateNextStrategyCycleFromResults(strategyCycleId);

  const existingPosts = await db.query.contentItems.findMany({
    where: eq(schema.contentItems.strategyCycleId, nextCycle.id),
  });
  const posts = existingPosts.length
    ? existingPosts
    : await generateNextContentPackFromIteration(nextCycle.id, analysisResult.analysis);

  return {
    sourceCycleId: strategyCycleId,
    nextCycle,
    analysis: analysisResult.analysis,
    posts,
  };
}
