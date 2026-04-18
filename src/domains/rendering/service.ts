import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { FfmpegUnavailableError } from "@/lib/render/ffmpeg";
import { renderTemplateIdSchema, type RenderTemplateId } from "@/lib/render/templates";
import { prepareRenderOutput } from "@/lib/render/storage";
import { listContentItemsForStrategyCycle } from "@/domains/content-items/service";
import { incrementUsageCounter } from "@/domains/usage/service";
import { legacyRenderAdapter } from "@/lib/render/adapters/legacy";
import { HyperframesDisabledError, hyperframesRenderAdapter } from "@/lib/render/adapters/hyperframes";
import type { RenderBackend } from "@/lib/render/adapters/types";
import { normalizeProjectChannels, resolveContentItemTargetChannel, type ProjectChannel } from "@/lib/utils/channels";
import { HyperframesUnavailableError } from "@/lib/render/hyperframes/cli";
import { assertCanAffordAction, chargeCredits, getCreditEntryByReference } from "@/domains/credits/service";
import { getBillingPolicy } from "@/domains/credits/policy";

function buildSlidesForRender(item: typeof schema.contentItems.$inferSelect) {
  const middleSlides = ((item.slidesJson as string[]) ?? []).filter(Boolean);
  const coreMiddle = middleSlides.slice(0, 5);

  while (coreMiddle.length < 3) {
    coreMiddle.push(item.caption);
  }

  return [item.hook, ...coreMiddle, `CTA: ${item.ctaText}`].slice(0, 7);
}

function resolveTargetChannel(params: {
  requested?: ProjectChannel;
  item: typeof schema.contentItems.$inferSelect;
  project: typeof schema.projects.$inferSelect;
}): ProjectChannel {
  if (params.requested) return params.requested;
  if (params.item.targetChannel) return resolveContentItemTargetChannel(params.item.targetChannel, params.item.platform);
  if (params.item.platform === "instagram" || params.item.platform === "tiktok") return params.item.platform;
  const preferred = normalizeProjectChannels(params.project.preferredChannelsJson, params.project.preferredChannels);
  return preferred[0] ?? "instagram";
}

function pickChannelText(
  item: typeof schema.contentItems.$inferSelect,
  targetChannel: ProjectChannel,
): { caption: string; ctaText: string } {
  const channelCaptions = (item.channelCaptionsJson as Partial<Record<ProjectChannel, string>> | null) ?? {};
  const channelCtas = (item.channelCtaTextJson as Partial<Record<ProjectChannel, string>> | null) ?? {};
  return {
    caption: channelCaptions[targetChannel] ?? item.caption,
    ctaText: channelCtas[targetChannel] ?? item.ctaText,
  };
}

function pickOptionalVisualAssets(project: typeof schema.projects.$inferSelect): { logoUrl?: string | null; backgroundUrl?: string | null } {
  const voice = (project.voicePrefsJson as Record<string, unknown> | null) ?? {};
  const logoUrl = typeof voice.logo_url === "string" ? voice.logo_url : null;
  const backgroundUrl = typeof voice.background_asset_url === "string" ? voice.background_asset_url : null;
  return { logoUrl, backgroundUrl };
}

function resolveTemplateId(requested: RenderTemplateId | undefined, current: string): RenderTemplateId | undefined {
  if (requested) return requested;
  const parsed = renderTemplateIdSchema.safeParse(current);
  return parsed.success ? parsed.data : undefined;
}

async function upsertAsset(params: {
  contentItemId: string;
  assetType: "video" | "thumbnail";
  storageUrl: string;
  storagePath: string;
  durationSec?: number;
  width?: number;
  height?: number;
  metadataJson?: Record<string, unknown>;
}) {
  const existing = await db.query.contentAssets.findFirst({
    where: and(
      eq(schema.contentAssets.contentItemId, params.contentItemId),
      eq(schema.contentAssets.assetType, params.assetType),
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(schema.contentAssets)
      .set({
        storageUrl: params.storageUrl,
        storagePath: params.storagePath,
        durationSec: params.durationSec ?? null,
        width: params.width ?? null,
        height: params.height ?? null,
        metadataJson: {
          ...((existing.metadataJson as Record<string, unknown> | null) ?? {}),
          superseded_at: new Date().toISOString(),
          ...(params.metadataJson ?? {}),
        },
      })
      .where(eq(schema.contentAssets.id, existing.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(schema.contentAssets)
    .values({
      contentItemId: params.contentItemId,
      assetType: params.assetType,
      storageUrl: params.storageUrl,
      storagePath: params.storagePath,
      durationSec: params.durationSec ?? null,
      width: params.width ?? null,
      height: params.height ?? null,
      metadataJson: params.metadataJson ?? null,
    })
    .returning();

  return created;
}

export async function getAssetsForContentItem(contentItemId: string) {
  const assets = await db.query.contentAssets.findMany({
    where: eq(schema.contentAssets.contentItemId, contentItemId),
    orderBy: [desc(schema.contentAssets.createdAt)],
  });

  return {
    all: assets,
    video: assets.find((asset) => asset.assetType === "video") ?? null,
    thumbnail: assets.find((asset) => asset.assetType === "thumbnail") ?? null,
  };
}

export async function renderContentItem(
  contentItemId: string,
  options?: { templateId?: RenderTemplateId; renderer?: RenderBackend; targetChannel?: ProjectChannel; chargeCredits?: boolean },
) {
  const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
  if (!item) throw new Error("Content item not found");
  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, item.projectId) });
  if (!project) throw new Error("Project not found");
  const shouldChargeCredits = options?.chargeCredits !== false;
  const policy = getBillingPolicy("content_item_render");
  if (shouldChargeCredits && !policy.billable) {
    throw new Error("Billing policy mismatch for content item render.");
  }
  const renderPolicy = policy.billable ? policy : null;
  const existingRenderCharge =
    shouldChargeCredits
      ? await getCreditEntryByReference({
          userId: project.userId,
          referenceType: "content_item_render",
          referenceId: contentItemId,
        })
      : null;
  if (shouldChargeCredits && !existingRenderCharge && renderPolicy) {
    await assertCanAffordAction(project.userId, [{ bucket: renderPolicy.bucket, amount: renderPolicy.amount }]);
  }
  const renderer: RenderBackend = options?.renderer ?? "legacy";
  const targetChannel = resolveTargetChannel({ requested: options?.targetChannel, item, project });
  const resolvedTemplateId = resolveTemplateId(options?.templateId, item.templateId);
  const slides = buildSlidesForRender(item);
  const channelCopy = pickChannelText(item, targetChannel);
  const visualAssets = pickOptionalVisualAssets(project);

  await db
    .update(schema.contentItems)
    .set({
      renderStatus: "rendering",
      templateId: resolvedTemplateId ?? item.templateId,
      updatedAt: new Date(),
    })
    .where(eq(schema.contentItems.id, contentItemId));

  try {
    const output = await prepareRenderOutput(contentItemId);
    const adapter = renderer === "legacy" ? legacyRenderAdapter : hyperframesRenderAdapter;
    const result = await adapter.render({
      contentItemId,
      templateId: resolvedTemplateId,
      targetChannel,
      hook: item.hook,
      slides,
      caption: channelCopy.caption,
      ctaText: channelCopy.ctaText,
      businessName: project.businessName ?? project.productName,
      logoUrl: visualAssets.logoUrl,
      backgroundUrl: visualAssets.backgroundUrl,
      output: {
        runDir: output.runDir,
        videoPath: output.videoPath,
        thumbnailPath: output.thumbnailPath,
        videoUrl: output.videoUrl,
        thumbnailUrl: output.thumbnailUrl,
      },
    });

    const videoAsset = await upsertAsset({
      contentItemId,
      assetType: "video",
      storagePath: result.videoPath,
      storageUrl: result.videoUrl,
      durationSec: result.durationSec,
      width: result.width,
      height: result.height,
      metadataJson: {
        templateId: result.templateId,
        renderer: result.renderer,
        targetChannel,
        ...(result.metadataJson ?? {}),
      },
    });

    const thumbnailAsset = await upsertAsset({
      contentItemId,
      assetType: "thumbnail",
      storagePath: result.thumbnailPath,
      storageUrl: result.thumbnailUrl,
      width: result.width,
      height: result.height,
      metadataJson: {
        templateId: result.templateId,
        renderer: result.renderer,
        targetChannel,
      },
    });

    await db
      .update(schema.contentItems)
      .set({
        renderStatus: "completed",
        updatedAt: new Date(),
      })
      .where(eq(schema.contentItems.id, contentItemId));

    if (shouldChargeCredits && renderPolicy) {
      await chargeCredits({
        userId: project.userId,
        bucket: renderPolicy.bucket,
        amount: renderPolicy.amount,
        reason: renderPolicy.reason,
        referenceType: "content_item_render",
        referenceId: contentItemId,
        metadata: {
          contentItemId,
          projectId: project.id,
          targetChannel,
          renderer: result.renderer,
          templateId: result.templateId,
          source: "non_chat_render",
        },
      });
    }

    await incrementUsageCounter({
      userId: project.userId,
      projectId: project.id,
      period: "month",
      field: "videosRendered",
      amount: 1,
    });

    return { contentItem: item, videoAsset, thumbnailAsset, templateId: result.templateId, renderer: result.renderer, targetChannel };
  } catch (error) {
    await db
      .update(schema.contentItems)
      .set({
        renderStatus: "failed",
        updatedAt: new Date(),
      })
      .where(eq(schema.contentItems.id, contentItemId));

    if (error instanceof FfmpegUnavailableError || error instanceof HyperframesUnavailableError || error instanceof HyperframesDisabledError) {
      throw error;
    }

    throw new Error(error instanceof Error ? error.message : "Render failed");
  }
}

export async function renderStrategyCycleContent(
  strategyCycleId: string,
  options?: { templateId?: RenderTemplateId; renderer?: RenderBackend; targetChannel?: ProjectChannel },
) {
  const strategyCycle = await db.query.strategyCycles.findFirst({ where: eq(schema.strategyCycles.id, strategyCycleId) });
  if (!strategyCycle) throw new Error("Strategy cycle not found");

  const posts = await listContentItemsForStrategyCycle(strategyCycleId);
  const results: Array<Awaited<ReturnType<typeof renderContentItem>>> = [];
  const errors: Array<{ contentItemId: string; error: string }> = [];

  for (const post of posts) {
    try {
      const rendered = await renderContentItem(post.id, options);
      results.push(rendered);
    } catch (error) {
      errors.push({
        contentItemId: post.id,
        error: error instanceof Error ? error.message : "Unknown render error",
      });
    }
  }

  return {
    strategyCycleId,
    total: posts.length,
    rendered: results.length,
    failed: errors.length,
    results,
    errors,
  };
}
