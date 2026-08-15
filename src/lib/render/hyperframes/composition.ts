import { promises as fs } from "node:fs";
import path from "node:path";
import type { HyperframesCompositionInput, HyperframesCompositionPackage } from "@/lib/render/hyperframes/types";
// Import RenderTemplate to access styling properties
import type { RenderTemplate } from "@/lib/render/templates";

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
  // Basic image tag, could be enhanced with more attributes based on style/plan
  return templateHtml.replace(placeholder, `<img src="${escapeHtml(url)}" class="${className}" alt="${escapeHtml(alt)}" />`);
}

function normalizeTemplateColor(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("0x")) {
    return `#${trimmed.slice(2)}`;
  }

  const alphaMatch = /^([a-zA-Z]+)@(0(?:\.\d+)?|1(?:\.0+)?)$/.exec(trimmed);
  if (alphaMatch) {
    const [, base, alpha] = alphaMatch;
    const normalizedBase = base.toLowerCase();
    if (normalizedBase === "white") return `rgba(255, 255, 255, ${alpha})`;
    if (normalizedBase === "black") return `rgba(0, 0, 0, ${alpha})`;
  }

  return trimmed;
}

function buildScenePlanSummary(input: HyperframesCompositionInput): string {
  const scenes = input.scenePlan
    .slice(0, 3)
    .map((scene, index) => {
      const text = scene.primaryText?.trim() || scene.purpose.trim();
      return `${index + 1}. ${text}`;
    });

  if (scenes.length === 0) return input.channelCaption;

  return scenes.join(" • ");
}

function buildSceneBlocksMarkup(input: HyperframesCompositionInput): string {
  if (input.scenePlan.length === 0) {
    return `<div class="scene-block is-static"><div class="scene-primary">${escapeHtml(input.channelCaption)}</div></div>`;
  }

  return input.scenePlan
    .map((scene, index) => {
      const primary = scene.primaryText?.trim() || scene.purpose.trim();
      const secondary = scene.secondaryText?.trim() || "";
      const cta = scene.cta?.trim() || "";

      const chunks = [
        `<div class="scene-kicker">${escapeHtml(scene.purpose)}</div>`,
        `<div class="scene-primary">${escapeHtml(primary)}</div>`,
        secondary ? `<div class="scene-secondary">${escapeHtml(secondary)}</div>` : "",
        cta ? `<div class="scene-cta">${escapeHtml(cta)}</div>` : "",
      ].filter(Boolean);

      return `<div class="scene-block scene-variant-${index % 4}" style="--scene-start-ms:${scene.timing.startMs};--scene-duration-ms:${scene.timing.durationMs};" data-scene-index="${index}"><div class="scene-orb"></div><div class="scene-progress"></div><div class="scene-copy"><div class="scene-count">${String(index + 1).padStart(2, "0")}</div>${chunks.join("")}</div></div>`;
    })
    .join("\n");
}

// Helper to apply styles based on a RenderTemplate object and potentially other planning inputs
function applyStylesAndStructure(
  templateHtml: string,
  renderTemplate: RenderTemplate,
  input: HyperframesCompositionInput // Pass the full input for tone, visualNotes, scenePlan
): string {
  let modifiedHtml = templateHtml;

  // Injecting style preset properties into the template.
  // This assumes placeholders like {{BG_COLOR}}, {{TEXT_COLOR}}, {{FONT_SIZE}}, {{FOOTER_COLOR}}, {{BOX_COLOR}} exist in the template.
  // If not, these would need to be added to promo-social.html or handled differently.
  modifiedHtml = modifiedHtml.replaceAll("{{BG_COLOR}}", normalizeTemplateColor(renderTemplate.bgColor));
  modifiedHtml = modifiedHtml.replaceAll("{{TEXT_COLOR}}", normalizeTemplateColor(renderTemplate.textColor));
  modifiedHtml = modifiedHtml.replaceAll("{{FONT_SIZE}}", renderTemplate.fontSize.toString());
  modifiedHtml = modifiedHtml.replaceAll("{{FOOTER_COLOR}}", normalizeTemplateColor(renderTemplate.footerColor));
  modifiedHtml = modifiedHtml.replaceAll("{{BOX_COLOR}}", normalizeTemplateColor(renderTemplate.boxColor));
  modifiedHtml = modifiedHtml.replaceAll("{{HOOK_BOX_BG}}", normalizeTemplateColor(renderTemplate.boxColor));
  modifiedHtml = modifiedHtml.replaceAll("{{SHADE_COLOR}}", normalizeTemplateColor(renderTemplate.bgColor));
  modifiedHtml = modifiedHtml.replaceAll("{{DURATION_SEC}}", String(input.durationSec || renderTemplate.slideDurationSec));
  
  // Apply dynamic duration via a placeholder if the template supports it.
  // Example: <!-- DURATION_MS --> or similar. For now, we'll use the durationSec directly.
  // The actual HTML structure for duration control might vary.
  
  // Basic integration of tone and visual notes might involve adding them as data attributes or comments,
  // or influencing other parts of the generation if the template is more dynamic.
  // For now, let's assume they are logged or used in more complex logic not shown here.

  const scenePlanSummary = buildScenePlanSummary(input);
  modifiedHtml = modifiedHtml.replaceAll("{{SCENE_PLAN_SUMMARY}}", escapeHtml(scenePlanSummary));
  modifiedHtml = modifiedHtml.replaceAll("{{SCENE_BLOCKS}}", buildSceneBlocksMarkup(input));

  return modifiedHtml;
}


export async function buildHyperframesComposition(
  params: {
    input: HyperframesCompositionInput;
    renderTemplate: RenderTemplate; // Pass the selected RenderTemplate
    runDir: string;
  }
): Promise<HyperframesCompositionPackage> {
  const { input, renderTemplate, runDir } = params;

  const templatePath = path.join(process.cwd(), "templates", "hyperframes", "promo-social.html");
  const templateHtml = await fs.readFile(templatePath, "utf8");

  const effectiveCaption = input.scenePlan.length > 0 ? buildScenePlanSummary(input) : input.channelCaption;

  let html = templateHtml
    .replaceAll("{{BUSINESS_NAME}}", escapeHtml(input.businessName))
    .replaceAll("{{HOOK}}", escapeHtml(input.hook))
    .replaceAll("{{CHANNEL_CAPTION}}", escapeHtml(effectiveCaption))
    .replaceAll("{{CHANNEL_CTA}}", escapeHtml(input.channelCta))
    .replaceAll("{{TARGET_CHANNEL}}", escapeHtml(input.targetChannel));
    
  // Apply styles and other dynamic content based on render template and input
  html = applyStylesAndStructure(html, renderTemplate, input);

  html = withOptionalImage(html, "<!-- OPTIONAL_LOGO -->", input.logoUrl, "logo", "Business logo");
  html = withOptionalImage(html, "<!-- OPTIONAL_BACKGROUND -->", input.backgroundUrl, "bg", "Background media");

  const jobDir = path.join(runDir, "hyperframes");
  await fs.mkdir(jobDir, { recursive: true });

  const compositionHtmlPath = path.join(jobDir, "composition.html");
  const metadataPath = path.join(jobDir, "composition.json");

  const metadata = {
    contentItemId: input.contentItemId,
    businessName: input.businessName,
    targetChannel: input.targetChannel,
    templateId: renderTemplate.id, // Use the templateId from the selected RenderTemplate
    stylePreset: input.stylePreset, // Include style preset in metadata
    templateFamily: input.templateFamily, // Include template family in metadata
    dimensions: { width: renderTemplate.width, height: renderTemplate.height },
    fps: renderTemplate.fps,
    // Use dynamic duration from input, falling back to renderTemplate's slideDurationSec
    durationSec: input.durationSec || renderTemplate.slideDurationSec, 
    tone: input.tone,
    visualNotes: input.visualNotes,
    // The scenePlan is not directly serialized into metadata here but is available in the input.
    // If needed, it could be serialized or used to construct metadata about scenes.
    scenePlan: input.scenePlan, // Include scenePlan in metadata for debugging/reference
    assets: {
      logoUrl: input.logoUrl ?? null,
      backgroundUrl: input.backgroundUrl ?? null,
    },
  };

  await fs.writeFile(compositionHtmlPath, html, "utf8");
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf8");

  return {
    compositionHtmlPath,
    metadataPath,
    jobDir,
    width: renderTemplate.width,
    height: renderTemplate.height,
    fps: renderTemplate.fps,
    durationSec: input.durationSec || renderTemplate.slideDurationSec,
    templateId: renderTemplate.id, 
  };
}
