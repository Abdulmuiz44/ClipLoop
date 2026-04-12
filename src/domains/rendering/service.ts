import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { assertFfmpegAvailable, FfmpegUnavailableError, generateThumbnail, renderSlidesToVideo } from "@/lib/render/ffmpeg";
import { getRenderTemplate, type RenderTemplateId } from "@/lib/render/templates";
import { prepareRenderOutput } from "@/lib/render/storage";
import { listContentItemsForStrategyCycle } from "@/domains/content-items/service";
import { assertRenderAllowed, incrementUsageCounter } from "@/domains/usage/service";

function buildSlidesForRender(item: typeof schema.contentItems.$inferSelect) {
  const middleSlides = ((item.slidesJson as string[]) ?? []).filter(Boolean);
  const coreMiddle = middleSlides.slice(0, 5);

  while (coreMiddle.length < 3) {
    coreMiddle.push(item.caption);
  }

  return [item.hook, ...coreMiddle, `CTA: ${item.ctaText}`].slice(0, 7);
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

export async function renderContentItem(contentItemId: string, templateId?: RenderTemplateId) {
  const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
  if (!item) throw new Error("Content item not found");
  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, item.projectId) });
  if (!project) throw new Error("Project not found");
  await assertRenderAllowed(project.userId, 1);

  const template = getRenderTemplate(templateId ?? item.templateId);
  const slides = buildSlidesForRender(item);

  await db
    .update(schema.contentItems)
    .set({
      renderStatus: "rendering",
      templateId: template.id,
      updatedAt: new Date(),
    })
    .where(eq(schema.contentItems.id, contentItemId));

  try {
    assertFfmpegAvailable();
    const output = await prepareRenderOutput(contentItemId);

    await renderSlidesToVideo({
      slides,
      footerText: `${template.displayName} • ${item.ctaText}`,
      template,
      workDir: output.runDir,
      outputVideoPath: output.videoPath,
    });

    await generateThumbnail(output.videoPath, output.thumbnailPath);

    const duration = Math.round(slides.length * template.slideDurationSec);

    const videoAsset = await upsertAsset({
      contentItemId,
      assetType: "video",
      storagePath: output.videoPath,
      storageUrl: output.videoUrl,
      durationSec: duration,
      width: template.width,
      height: template.height,
      metadataJson: { templateId: template.id, slideCount: slides.length },
    });

    const thumbnailAsset = await upsertAsset({
      contentItemId,
      assetType: "thumbnail",
      storagePath: output.thumbnailPath,
      storageUrl: output.thumbnailUrl,
      width: template.width,
      height: template.height,
      metadataJson: { templateId: template.id },
    });

    await db
      .update(schema.contentItems)
      .set({
        renderStatus: "completed",
        updatedAt: new Date(),
      })
      .where(eq(schema.contentItems.id, contentItemId));

    await incrementUsageCounter({
      userId: project.userId,
      projectId: project.id,
      period: "month",
      field: "videosRendered",
      amount: 1,
    });

    return { contentItem: item, videoAsset, thumbnailAsset, templateId: template.id };
  } catch (error) {
    await db
      .update(schema.contentItems)
      .set({
        renderStatus: "failed",
        updatedAt: new Date(),
      })
      .where(eq(schema.contentItems.id, contentItemId));

    if (error instanceof FfmpegUnavailableError) {
      throw error;
    }

    throw new Error(error instanceof Error ? error.message : "Render failed");
  }
}

export async function renderStrategyCycleContent(strategyCycleId: string, templateId?: RenderTemplateId) {
  const strategyCycle = await db.query.strategyCycles.findFirst({ where: eq(schema.strategyCycles.id, strategyCycleId) });
  if (!strategyCycle) throw new Error("Strategy cycle not found");

  const posts = await listContentItemsForStrategyCycle(strategyCycleId);
  const results: Array<Awaited<ReturnType<typeof renderContentItem>>> = [];
  const errors: Array<{ contentItemId: string; error: string }> = [];

  for (const post of posts) {
    try {
      const rendered = await renderContentItem(post.id, templateId);
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
