import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { generateStructuredObject } from "@/lib/llm";
import { postGenerationPrompt, regeneratePostPrompt } from "@/lib/prompts/templates";
import { PROMPT_VERSIONS } from "@/lib/prompts/versions";
import { postBatchOutputSchema, singlePostOutputSchema } from "@/lib/validation/content";
import { buildTrackingSlug } from "@/lib/utils/slugs";
import { incrementUsageCounter } from "@/domains/usage/service";
import { assertCanAffordAction, chargeCredits } from "@/domains/credits/service";
import { getBillingPolicy } from "@/domains/credits/policy";
import {
  defaultPublishStrategyForChannel,
  normalizeProjectChannels,
  pickDeterministicChannel,
  resolveContentItemTargetChannel,
  type ProjectChannel,
  type PublishStrategy,
} from "@/lib/utils/channels";

function buildMockChannelCaptions(input: {
  channels: ProjectChannel[];
  businessName: string;
  audience: string;
  offer: string;
  cta: string;
}): Partial<Record<ProjectChannel, string>> {
  const variants: Partial<Record<ProjectChannel, string>> = {};
  for (const channel of input.channels) {
    if (channel === "instagram") {
      variants[channel] = `${input.businessName} for ${input.audience}. ${input.offer}. ${input.cta}`;
    }
    if (channel === "tiktok") {
      variants[channel] = `Quick look: ${input.offer}. ${input.businessName} for ${input.audience}. ${input.cta}`;
    }
    if (channel === "whatsapp") {
      variants[channel] = `${input.offer}. ${input.cta}`;
    }
  }
  return variants;
}

function buildMockChannelCtas(input: { channels: ProjectChannel[]; cta: string }): Partial<Record<ProjectChannel, string>> {
  const variants: Partial<Record<ProjectChannel, string>> = {};
  for (const channel of input.channels) {
    if (channel === "instagram") variants[channel] = input.cta;
    if (channel === "tiktok") variants[channel] = `Watch until the end, then ${input.cta.toLowerCase()}`;
    if (channel === "whatsapp") variants[channel] = `Tap to order now`;
  }
  return variants;
}

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

export async function updateContentItemTargetChannel(contentItemId: string, targetChannel: ProjectChannel) {
  const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
  if (!item) throw new Error("Content item not found");

  const channelCaptions = (item.channelCaptionsJson as Partial<Record<ProjectChannel, string>> | null) ?? {};
  const channelCtas = (item.channelCtaTextJson as Partial<Record<ProjectChannel, string>> | null) ?? {};

  const [updated] = await db
    .update(schema.contentItems)
    .set({
      targetChannel,
      publishStrategy: defaultPublishStrategyForChannel(targetChannel),
      caption: channelCaptions[targetChannel] ?? item.caption,
      ctaText: channelCtas[targetChannel] ?? item.ctaText,
      updatedAt: new Date(),
    })
    .where(eq(schema.contentItems.id, contentItemId))
    .returning();

  return updated;
}

export async function updateContentItemPublishStrategy(contentItemId: string, publishStrategy: PublishStrategy) {
  const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
  if (!item) throw new Error("Content item not found");

  const targetChannel = resolveContentItemTargetChannel(item.targetChannel, item.platform);
  if (targetChannel !== "instagram" && publishStrategy === "direct_instagram") {
    throw new Error(`direct_instagram strategy is only allowed for instagram target channel.`);
  }

  const [updated] = await db
    .update(schema.contentItems)
    .set({
      publishStrategy,
      manualPublishStatus: publishStrategy === "manual_export" ? "ready_for_export" : item.manualPublishStatus,
      updatedAt: new Date(),
    })
    .where(eq(schema.contentItems.id, contentItemId))
    .returning();

  return updated;
}

export async function markContentItemExported(contentItemId: string) {
  const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
  if (!item) throw new Error("Content item not found");
  if (item.publishStrategy !== "manual_export") return item;
  if (item.manualPublishStatus === "posted") return item;

  const [updated] = await db
    .update(schema.contentItems)
    .set({
      manualPublishStatus: "exported",
      updatedAt: new Date(),
    })
    .where(eq(schema.contentItems.id, contentItemId))
    .returning();

  return updated;
}

export async function markContentItemManualPosted(contentItemId: string) {
  const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
  if (!item) throw new Error("Content item not found");
  if (item.publishStrategy !== "manual_export") {
    throw new Error("Only manual_export items can be marked as posted.");
  }

  const [updated] = await db
    .update(schema.contentItems)
    .set({
      manualPublishStatus: "posted",
      publishStatus: "published",
      publishedAt: item.publishedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.contentItems.id, contentItemId))
    .returning();

  return updated;
}

export async function listManualQueueItemsForUser(
  userId: string,
  input?: {
    targetChannel?: "instagram" | "tiktok" | "whatsapp" | "all";
    manualStatus?: "ready_for_export" | "exported" | "posted" | "all";
    sort?: "newest" | "oldest";
  },
) {
  const projects = await db.query.projects.findMany({
    where: eq(schema.projects.userId, userId),
    columns: { id: true, name: true, productName: true },
  });
  const projectIds = projects.map((project) => project.id);
  if (projectIds.length === 0) return [];

  const rows = await db.query.contentItems.findMany({
    where: and(eq(schema.contentItems.publishStrategy, "manual_export"), inArray(schema.contentItems.projectId, projectIds)),
    orderBy: [desc(schema.contentItems.createdAt)],
  });

  const byProject = new Map(projects.map((project) => [project.id, project]));
  let filtered = rows;

  if (input?.targetChannel && input.targetChannel !== "all") {
    filtered = filtered.filter((row) => row.targetChannel === input.targetChannel);
  }
  if (input?.manualStatus && input.manualStatus !== "all") {
    filtered = filtered.filter((row) => row.manualPublishStatus === input.manualStatus);
  }
  if (input?.sort === "oldest") {
    filtered = [...filtered].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  return filtered.map((row) => ({
    ...row,
    project: byProject.get(row.projectId) ?? null,
    isRendered: row.renderStatus === "completed",
  }));
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
  const generatePostsPolicy = getBillingPolicy("strategy_cycle_generate_posts");
  if (!generatePostsPolicy.billable) {
    throw new Error("Billing policy mismatch for strategy cycle post generation.");
  }
  await assertCanAffordAction(project.userId, [{ bucket: generatePostsPolicy.bucket, amount: generatePostsPolicy.amount }]);
  const preferredChannels = normalizeProjectChannels(project.preferredChannelsJson, project.preferredChannels);

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
        projectType: project.projectType,
        businessName: project.businessName,
        businessCategory: project.businessCategory,
        businessDescription: project.businessDescription,
        city: project.city,
        state: project.state,
        targetAudience: project.targetAudience,
        primaryOffer: project.primaryOffer,
        priceRange: project.priceRange,
        tone: project.tone,
        callToAction: project.callToAction,
        instagramHandle: project.instagramHandle,
        whatsappNumber: project.whatsappNumber,
        websiteUrl: project.websiteUrl,
        ctaUrl: project.ctaUrl,
        preferredChannels,
        languageStyle: project.languageStyle,
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
        internal_title: `Post ${idx + 1}: ${project.businessName ?? project.productName} promo`,
        hook:
          project.languageStyle === "pidgin"
            ? `${project.primaryOffer ?? project.offer} dey run now for ${project.targetAudience ?? project.audience}`
            : `${project.primaryOffer ?? project.offer} for ${project.targetAudience ?? project.audience} this week`,
        slides: [
          `Offer: ${project.primaryOffer ?? project.offer}`,
          `Audience: ${project.targetAudience ?? project.audience}`,
          `Proof: Trusted by customers${project.city ? ` in ${project.city}` : ""}`,
          `CTA: ${project.callToAction ?? "Send us a DM now"}`,
        ],
        caption:
          project.languageStyle === "pidgin"
            ? `${project.businessName ?? project.productName} dey help ${project.targetAudience ?? project.audience}. ${project.callToAction ?? "Send DM make we start."}`
            : `${project.businessName ?? project.productName} helps ${project.targetAudience ?? project.audience}. ${project.callToAction ?? "Send us a DM to get started."}`,
        channel_captions: buildMockChannelCaptions({
          channels: preferredChannels,
          businessName: project.businessName ?? project.productName,
          audience: project.targetAudience ?? project.audience,
          offer: project.primaryOffer ?? project.offer,
          cta: project.callToAction ?? "Send us a DM now",
        }),
        cta_text: project.callToAction ?? "Send us a DM now",
        channel_cta_text: buildMockChannelCtas({
          channels: preferredChannels,
          cta: project.callToAction ?? "Send us a DM now",
        }),
        hashtags: ["#business", "#promo", "#growth"],
        why_it_should_work: "Offer-led hook with direct CTA, urgency, and social-proof framing.",
      })),
    }),
  });

  const newContentItems: typeof schema.contentItems.$inferInsert[] = structured.posts.map((post, idx) => {
    const targetChannel = pickDeterministicChannel(preferredChannels, idx);
    return {
      targetChannel,
      publishStrategy: defaultPublishStrategyForChannel(targetChannel),
    projectId: project.id,
    strategyCycleId,
    platform: "instagram",
    contentType: "slideshow_video",
    internalTitle: post.internal_title,
    angle: `angle-${idx + 1}`,
    hook: post.hook,
    slidesJson: post.slides,
    caption: post.caption,
    channelCaptionsJson: post.channel_captions ?? {},
    hashtagsJson: post.hashtags,
    ctaText: post.cta_text,
    channelCtaTextJson: post.channel_cta_text ?? {},
    destinationUrl: project.ctaUrl,
    trackingSlug: buildTrackingSlug(project.productName, `${strategyCycleId}-${idx + 1}`),
    templateId: "clean_dark",
    renderStatus: "pending",
    publishStatus: "draft",
    };
  });

  const inserted = await db
    .insert(schema.contentItems)
    .values(newContentItems)
    .returning();

  await chargeCredits({
    userId: project.userId,
    bucket: generatePostsPolicy.bucket,
    amount: generatePostsPolicy.amount,
    reason: generatePostsPolicy.reason,
    referenceType: "strategy_cycle_generate_posts",
    referenceId: strategyCycleId,
    metadata: {
      strategyCycleId,
      projectId: project.id,
      generatedCount: inserted.length,
      source: "non_chat_generate_posts",
    },
  });

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
  const regeneratePolicy = getBillingPolicy("content_item_regenerate");
  if (!regeneratePolicy.billable) {
    throw new Error("Billing policy mismatch for content item regenerate.");
  }

  const existingCharge = await db.query.creditLedgerEntries.findFirst({
    where: and(
      eq(schema.creditLedgerEntries.userId, project.userId),
      eq(schema.creditLedgerEntries.referenceType, "content_item_regenerate"),
      eq(schema.creditLedgerEntries.referenceId, item.id),
    ),
  });
  if (existingCharge) {
    const existingRegenerated = await db.query.contentItems.findFirst({
      where: and(eq(schema.contentItems.parentContentItemId, item.id), eq(schema.contentItems.projectId, project.id)),
      orderBy: [desc(schema.contentItems.createdAt)],
    });
    if (existingRegenerated) {
      return existingRegenerated;
    }
  } else {
    await assertCanAffordAction(project.userId, [{ bucket: regeneratePolicy.bucket, amount: regeneratePolicy.amount }]);
  }

  const structured = await generateStructuredObject({
    schema: singlePostOutputSchema,
    prompt: regeneratePostPrompt(
      {
        internal_title: item.internalTitle,
        hook: item.hook,
        slides: (item.slidesJson as string[]) ?? [],
        caption: item.caption,
        channel_captions: ((item.channelCaptionsJson as Record<string, string> | null) ?? {}) as any,
        cta_text: item.ctaText,
        channel_cta_text: ((item.channelCtaTextJson as Record<string, string> | null) ?? {}) as any,
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
        channel_captions: (item.channelCaptionsJson as Record<string, string> | null) ?? {},
        cta_text: item.ctaText,
        channel_cta_text: (item.channelCtaTextJson as Record<string, string> | null) ?? {},
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
      targetChannel: resolveContentItemTargetChannel(item.targetChannel, item.platform),
      publishStrategy: (item.publishStrategy as PublishStrategy | null) ?? defaultPublishStrategyForChannel(resolveContentItemTargetChannel(item.targetChannel, item.platform)),
      manualPublishStatus: item.manualPublishStatus,
      contentType: item.contentType,
      internalTitle: structured.post.internal_title,
      angle: item.angle,
      hook: structured.post.hook,
      slidesJson: structured.post.slides,
      caption: structured.post.caption,
      channelCaptionsJson: structured.post.channel_captions ?? ((item.channelCaptionsJson as Record<string, string> | null) ?? {}),
      hashtagsJson: structured.post.hashtags,
      ctaText: structured.post.cta_text,
      channelCtaTextJson: structured.post.channel_cta_text ?? ((item.channelCtaTextJson as Record<string, string> | null) ?? {}),
      destinationUrl: item.destinationUrl,
      trackingSlug: buildTrackingSlug(project.productName, `regen-${item.id}`),
      templateId: "clean_dark",
      renderStatus: "pending",
      publishStatus: "draft",
    })
    .returning();

  await chargeCredits({
    userId: project.userId,
    bucket: regeneratePolicy.bucket,
    amount: regeneratePolicy.amount,
    reason: regeneratePolicy.reason,
    referenceType: "content_item_regenerate",
    referenceId: item.id,
    metadata: {
      projectId: project.id,
      contentItemId: item.id,
      regeneratedContentItemId: regenerated.id,
      source: "non_chat_regenerate",
    },
  });

  await incrementUsageCounter({ userId: project.userId, projectId: project.id, period: "week", field: "manualRegenerations", amount: 1 });
  return regenerated;
}
