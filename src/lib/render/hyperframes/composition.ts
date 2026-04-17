import { promises as fs } from "node:fs";
import path from "node:path";
import type { HyperframesCompositionInput, HyperframesCompositionPackage } from "@/lib/render/hyperframes/types";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function withOptionalImage(
  templateHtml: string,
  placeholder: "<!-- OPTIONAL_LOGO -->" | "<!-- OPTIONAL_BACKGROUND -->",
  url: string | null | undefined,
  className: string,
  alt: string,
) {
  if (!url) return templateHtml.replace(placeholder, "");
  return templateHtml.replace(placeholder, `<img src="${escapeHtml(url)}" class="${className}" alt="${escapeHtml(alt)}" />`);
}

export async function buildHyperframesComposition(params: {
  input: HyperframesCompositionInput;
  runDir: string;
}): Promise<HyperframesCompositionPackage> {
  const templatePath = path.join(process.cwd(), "templates", "hyperframes", "promo-social.html");
  const templateHtml = await fs.readFile(templatePath, "utf8");

  const jobDir = path.join(params.runDir, "hyperframes");
  await fs.mkdir(jobDir, { recursive: true });

  let html = templateHtml
    .replaceAll("{{BUSINESS_NAME}}", escapeHtml(params.input.businessName))
    .replaceAll("{{HOOK}}", escapeHtml(params.input.hook))
    .replaceAll("{{CHANNEL_CAPTION}}", escapeHtml(params.input.channelCaption))
    .replaceAll("{{CHANNEL_CTA}}", escapeHtml(params.input.channelCta))
    .replaceAll("{{TARGET_CHANNEL}}", escapeHtml(params.input.targetChannel));

  html = withOptionalImage(html, "<!-- OPTIONAL_LOGO -->", params.input.logoUrl, "logo", "Business logo");
  html = withOptionalImage(html, "<!-- OPTIONAL_BACKGROUND -->", params.input.backgroundUrl, "bg", "Background media");

  const compositionHtmlPath = path.join(jobDir, "composition.html");
  const metadataPath = path.join(jobDir, "composition.json");

  const metadata = {
    contentItemId: params.input.contentItemId,
    businessName: params.input.businessName,
    targetChannel: params.input.targetChannel,
    templateId: "hf_promo_v1",
    dimensions: { width: 1080, height: 1920 },
    fps: 30,
    durationSec: 8,
    assets: {
      logoUrl: params.input.logoUrl ?? null,
      backgroundUrl: params.input.backgroundUrl ?? null,
    },
  };

  await fs.writeFile(compositionHtmlPath, html, "utf8");
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf8");

  return {
    compositionHtmlPath,
    metadataPath,
    jobDir,
    width: 1080,
    height: 1920,
    fps: 30,
    durationSec: 8,
    templateId: "hf_promo_v1",
  };
}
