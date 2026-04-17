import { promises as fs } from "node:fs";
import archiver from "archiver";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { resolveContentItemTargetChannel } from "@/lib/utils/channels";

function safeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function dateStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function buildReadme(params: {
  businessName: string;
  targetChannel: string;
  publishStrategy: string;
  caption: string;
  cta: string;
  exportedAt: string;
  files: string[];
}) {
  return [
    "ClipLoop Manual Export Bundle",
    "",
    `Business: ${params.businessName}`,
    `Target channel: ${params.targetChannel}`,
    `Publish strategy: ${params.publishStrategy}`,
    `Exported at: ${params.exportedAt}`,
    "",
    "Caption:",
    params.caption,
    "",
    "CTA:",
    params.cta,
    "",
    "Files:",
    ...params.files.map((file) => `- ${file}`),
    "",
  ].join("\n");
}

export async function buildContentItemExportBundle(contentItemId: string) {
  const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
  if (!item) throw new Error("Content item not found");

  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, item.projectId) });
  if (!project) throw new Error("Project not found");

  const targetChannel = resolveContentItemTargetChannel(item.targetChannel, item.platform);
  const channelCaptions = (item.channelCaptionsJson as Record<string, string> | null) ?? {};
  const channelCtas = (item.channelCtaTextJson as Record<string, string> | null) ?? {};
  const caption = channelCaptions[targetChannel] ?? item.caption;
  const cta = channelCtas[targetChannel] ?? item.ctaText;

  const assets = await db.query.contentAssets.findMany({
    where: eq(schema.contentAssets.contentItemId, item.id),
  });

  const videoAsset = assets.find((asset) => asset.assetType === "video") ?? null;
  if (!videoAsset?.storagePath) {
    throw new Error("Rendered video is required before export. Render this content item first.");
  }
  const videoExists = await fs
    .access(videoAsset.storagePath)
    .then(() => true)
    .catch(() => false);
  if (!videoExists) {
    throw new Error("Rendered video file is missing. Re-render this content item before export.");
  }

  const thumbnailAsset = assets.find((asset) => asset.assetType === "thumbnail") ?? null;
  const exportTimestamp = dateStamp();
  const businessName = project.businessName ?? project.productName;
  const bundleRoot = `${safeSlug(businessName)}-${targetChannel}-${contentItemId.slice(0, 8)}-${exportTimestamp}`;
  const zipFileName = `${bundleRoot}.zip`;

  const manifest = {
    contentItemId: item.id,
    projectId: project.id,
    businessName,
    targetChannel,
    publishStrategy: item.publishStrategy,
    hook: item.hook,
    caption,
    cta,
    exportedAt: new Date().toISOString(),
    assets: {
      video: {
        storageUrl: videoAsset.storageUrl,
        storagePath: videoAsset.storagePath,
      },
      thumbnail: thumbnailAsset
        ? {
            storageUrl: thumbnailAsset.storageUrl,
            storagePath: thumbnailAsset.storagePath,
          }
        : null,
    },
  };

  const fileList: string[] = ["manifest.json", "README.txt", "caption.txt", "cta.txt", "assets/video.mp4"];
  if (thumbnailAsset) fileList.push("assets/thumbnail.jpg");

  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  const prefix = `${bundleRoot}/`;
  archive.append(JSON.stringify(manifest, null, 2), { name: `${prefix}manifest.json` });
  archive.append(caption, { name: `${prefix}caption.txt` });
  archive.append(cta, { name: `${prefix}cta.txt` });
  archive.append(
    buildReadme({
      businessName,
      targetChannel,
      publishStrategy: item.publishStrategy,
      caption,
      cta,
      exportedAt: manifest.exportedAt,
      files: fileList,
    }),
    { name: `${prefix}README.txt` },
  );

  archive.file(videoAsset.storagePath, { name: `${prefix}assets/video.mp4` });

  if (thumbnailAsset?.storagePath) {
    const exists = await fs
      .access(thumbnailAsset.storagePath)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      archive.file(thumbnailAsset.storagePath, { name: `${prefix}assets/thumbnail.jpg` });
    } else if (thumbnailAsset.storageUrl) {
      archive.append(`Thumbnail URL: ${thumbnailAsset.storageUrl}\n`, { name: `${prefix}assets/thumbnail.url.txt` });
    }
  }

  const archiveBuffer = await new Promise<Buffer>((resolve, reject) => {
    archive.on("warning", (error: Error) => reject(error));
    archive.on("error", (error: Error) => reject(error));
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    void archive.finalize();
  });

  return {
    fileName: zipFileName,
    buffer: archiveBuffer,
    contentType: "application/zip",
  };
}
