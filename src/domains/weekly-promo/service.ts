import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { generateStructuredObject } from "@/lib/llm";
import { prepareRenderOutput } from "@/lib/render/storage";
import { extractWebsiteText } from "@/lib/business/extractWebsiteText";
import { generateScenePlan } from "@/lib/prompts/scenePlanner";
import type { SceneBlock } from "@/lib/render/hyperframes/types";
import type { RenderAdapterResult } from "@/lib/render/adapters/types";
import {
  productContextSchema,
  weeklyPromoInputSchema,
  weeklyPromoScriptSchema,
  type ProductContext,
  type WeeklyPromoInput,
  type WeeklyPromoScript,
} from "@/lib/validation/weekly-promo";

export class VideoRendererUnavailableError extends Error {
  constructor(message = "Video renderer is unavailable.") {
    super(message);
    this.name = "VideoRendererUnavailableError";
  }
}

export class VideoRenderFailedError extends Error {
  constructor(message = "Video render failed.") {
    super(message);
    this.name = "VideoRenderFailedError";
  }
}

type RenderChannel = "instagram" | "tiktok" | "whatsapp";

const weeklyPromoToRenderChannel: Record<WeeklyPromoInput["channel"], RenderChannel> = {
  instagram: "instagram",
  tiktok: "tiktok",
  whatsapp: "whatsapp",
  x: "tiktok",
};

const defaultProductContextFromInput = (input: WeeklyPromoInput): ProductContext => ({
  productName: input.appName,
  oneLineDescription: `${input.appName} helps users ship outcomes faster.`,
  targetUsers: input.targetAudience ? [input.targetAudience] : [],
  mainBenefits: ["Faster execution", "Clear weekly momentum"],
  keyFeatures: ["Product updates", "Practical workflows"],
  ctaLanguage: input.callToAction ? [input.callToAction] : [],
  toneHints: [input.tone],
});

type Deps = {
  extractWebsiteTextFn: typeof extractWebsiteText;
  generateStructuredObjectFn: typeof generateStructuredObject;
  generateScenePlanFn: typeof generateScenePlan;
  prepareRenderOutputFn: typeof prepareRenderOutput;
  renderFn: (input: {
    contentItemId: string;
    channel: RenderChannel;
    script: WeeklyPromoScript;
    scenePlan: SceneBlock[];
    appName: string;
    output: Awaited<ReturnType<typeof prepareRenderOutput>>;
  }) => Promise<RenderAdapterResult>;
};

const defaultDeps: Deps = {
  extractWebsiteTextFn: extractWebsiteText,
  generateStructuredObjectFn: generateStructuredObject,
  generateScenePlanFn: generateScenePlan,
  prepareRenderOutputFn: async (id: string) => {
    const { prepareRenderOutput } = await import("@/lib/render/storage");
    return prepareRenderOutput(id);
  },
  renderFn: async ({ contentItemId, channel, script, appName, output }) => {
    const { hyperframesRenderAdapter } = await import("@/lib/render/adapters/hyperframes");
    return hyperframesRenderAdapter.render({
      contentItemId,
      targetChannel: channel,
      hook: script.hook,
      slides: script.body,
      caption: script.caption,
      ctaText: script.cta,
      businessName: appName,
      templateId: "hf_promo_v1",
      output: {
        runDir: output.runDir,
        videoPath: output.videoPath,
        thumbnailPath: output.thumbnailPath,
        videoUrl: output.videoUrl,
        thumbnailUrl: output.thumbnailUrl,
      },
    });
  },
};

async function extractProductContext(
  input: WeeklyPromoInput,
  deps: Deps,
): Promise<{ productContext: ProductContext; websiteContextUsed: boolean; scrapeError: string | null }> {
  const url = input.appWebsiteUrl?.trim();
  if (!url) {
    return {
      productContext: defaultProductContextFromInput(input),
      websiteContextUsed: false,
      scrapeError: null,
    };
  }

  try {
    const extracted = await deps.extractWebsiteTextFn(url);
    const productContext = await deps.generateStructuredObjectFn({
      schema: productContextSchema,
      mockFactory: () => defaultProductContextFromInput(input),
      prompt: [
        "Extract structured product context from this website text.",
        "Return practical, evidence-based context only.",
        "Fields required: productName, oneLineDescription, targetUsers, mainBenefits, keyFeatures, ctaLanguage, toneHints.",
        `Website URL: ${extracted.websiteUrl}`,
        "Raw website text:",
        extracted.extractedText,
      ].join("\n\n"),
    });

    return { productContext, websiteContextUsed: true, scrapeError: null };
  } catch (error) {
    return {
      productContext: defaultProductContextFromInput(input),
      websiteContextUsed: false,
      scrapeError: error instanceof Error ? error.message : "Website context extraction failed",
    };
  }
}

async function generateWeeklyScript(
  input: WeeklyPromoInput,
  productContext: ProductContext,
  deps: Deps,
): Promise<WeeklyPromoScript> {
  const cta = input.callToAction?.trim() || productContext.ctaLanguage[0] || "Try it now";
  return deps.generateStructuredObjectFn({
    schema: weeklyPromoScriptSchema,
    mockFactory: () => ({
      hook: `${input.appName}: ${input.weeklyUpdate}`,
      body: [
        `This week: ${input.weeklyUpdate}`,
        `Built for ${input.targetAudience || productContext.targetUsers[0] || "teams that ship fast"}`,
        productContext.mainBenefits[0] || "Move from idea to result quickly",
      ],
      caption: `${input.appName} weekly update: ${input.weeklyUpdate}`,
      cta,
      sceneOutline: [
        `1. Hook: ${input.weeklyUpdate}`,
        `2. Benefit: ${productContext.mainBenefits[0] || "Faster execution"}`,
        `3. Feature: ${productContext.keyFeatures[0] || "Product updates"}`,
        `4. CTA: ${cta}`,
      ],
    }),
    prompt: [
      "Create a short weekly promo script for a single video.",
      "The weeklyUpdate is the primary topic and MUST stay central.",
      "Website/product context is supporting context only.",
      `App name: ${input.appName}`,
      `Weekly update: ${input.weeklyUpdate}`,
      `Channel: ${input.channel}`,
      `Tone: ${input.tone}`,
      `Target audience: ${input.targetAudience || "not provided"}`,
      `Preferred CTA: ${cta}`,
      "Supporting product context:",
      JSON.stringify(productContext),
    ].join("\n\n"),
  });
}

async function saveArtifact(params: {
  id: string;
  input: WeeklyPromoInput;
  productContext: ProductContext;
  script: WeeklyPromoScript;
  scenePlan: SceneBlock[];
  renderResult: RenderAdapterResult;
  scrapeError: string | null;
  websiteContextUsed: boolean;
}) {
  const artifactDir = path.join(process.cwd(), "public", "generated", "weekly-promos", params.id);
  await fs.mkdir(artifactDir, { recursive: true });
  const artifactPath = path.join(artifactDir, "artifact.json");

  const payload = {
    id: params.id,
    createdAt: new Date().toISOString(),
    input: params.input,
    inputSnapshot: {
      appName: params.input.appName,
      appWebsiteUrl: params.input.appWebsiteUrl || "",
      weeklyUpdate: params.input.weeklyUpdate,
      targetAudience: params.input.targetAudience || "",
      callToAction: params.input.callToAction || "",
      channel: params.input.channel,
      tone: params.input.tone,
    },
    websiteContextUsed: params.websiteContextUsed,
    scrapeError: params.scrapeError,
    productContext: params.productContext,
    script: params.script,
    scenePlan: params.scenePlan,
    render: {
      renderer: params.renderResult.renderer,
      templateId: params.renderResult.templateId,
      durationSec: params.renderResult.durationSec,
      width: params.renderResult.width,
      height: params.renderResult.height,
      videoUrl: params.renderResult.videoUrl,
      thumbnailUrl: params.renderResult.thumbnailUrl,
      metadataJson: params.renderResult.metadataJson ?? null,
    },
  };

  await fs.writeFile(artifactPath, JSON.stringify(payload, null, 2), "utf8");

  return {
    artifactPath,
    artifactUrl: `/generated/weekly-promos/${params.id}/artifact.json`,
  };
}

export async function runWeeklyPromoMvp(rawInput: unknown, deps: Deps = defaultDeps) {
  const input = weeklyPromoInputSchema.parse(rawInput);
  const artifactId = `weekly-promo-${randomUUID()}`;
  const renderChannel = weeklyPromoToRenderChannel[input.channel];

  const { productContext, websiteContextUsed, scrapeError } = await extractProductContext(input, deps);
  const script = await generateWeeklyScript(input, productContext, deps);

  const scenePlan = deps.generateScenePlanFn({
    concept: script.hook,
    objective: "Turn this week update into a short promo clip with clear CTA.",
    targetChannel: renderChannel,
    stylePreset: "hf_promo_v1",
    recommendedTemplateFamily: "hf_promo_v1",
    cta: script.cta,
    tone: input.tone,
    durationSec: 12,
    sceneOutline: script.sceneOutline.join("\n"),
    visualDirectionNotes: `Weekly promo for ${input.appName}`,
  });

  const output = await deps.prepareRenderOutputFn(artifactId);
  const renderResult = await deps.renderFn({
    contentItemId: artifactId,
    channel: renderChannel,
    script,
    scenePlan,
    appName: input.appName,
    output,
  });

  const isRenderUnavailable =
    renderResult.metadataJson &&
    typeof renderResult.metadataJson === "object" &&
    (renderResult.metadataJson as Record<string, unknown>).rendererStatus === "unavailable";

  if (isRenderUnavailable) {
    throw new VideoRendererUnavailableError();
  }

  if (!renderResult.videoUrl || !renderResult.thumbnailUrl || !renderResult.videoPath) {
    throw new VideoRenderFailedError("Rendered video output is missing.");
  }

  const artifact = await saveArtifact({
    id: artifactId,
    input,
    productContext,
    script,
    scenePlan,
    renderResult,
    scrapeError,
    websiteContextUsed,
  });

  return {
    id: artifactId,
    websiteContextUsed,
    scrapeError,
    productContext,
    script,
    scenePlan,
    preview: {
      videoUrl: renderResult.videoUrl,
      thumbnailUrl: renderResult.thumbnailUrl,
      downloadUrl: renderResult.videoUrl,
    },
    artifact,
  };
}

export const __weeklyPromoInternals = {
  defaultProductContextFromInput,
};
