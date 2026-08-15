import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { generateStructuredObject } from "@/lib/llm";
import { prepareRenderOutput } from "@/lib/render/storage";
import type { RenderAdapterResult } from "@/lib/render/adapters/types";
import type { SceneBlock } from "@/lib/render/hyperframes/types";
import { ideaVideoInputSchema, ideaVideoPlanSchema, type IdeaVideoInput, type IdeaVideoPlan } from "@/lib/validation/idea-video";

export class IdeaVideoRendererUnavailableError extends Error {
  constructor() {
    super("Video renderer is unavailable.");
    this.name = "IdeaVideoRendererUnavailableError";
  }
}

export class IdeaVideoRenderFailedError extends Error {
  constructor(message = "Rendered video output is missing.") {
    super(message);
    this.name = "IdeaVideoRenderFailedError";
  }
}

export type IdeaVideoDeps = {
  generateStructuredObjectFn: typeof generateStructuredObject;
  prepareRenderOutputFn: typeof prepareRenderOutput;
  renderFn: (input: {
    contentItemId: string;
    plan: IdeaVideoPlan;
    durationSec: number;
    output: Awaited<ReturnType<typeof prepareRenderOutput>>;
  }) => Promise<RenderAdapterResult>;
};

const defaultDeps: IdeaVideoDeps = {
  generateStructuredObjectFn: generateStructuredObject,
  prepareRenderOutputFn: async (id: string) => {
    const { prepareRenderOutput } = await import("@/lib/render/storage");
    return prepareRenderOutput(id);
  },
  renderFn: async ({ contentItemId, plan, durationSec, output }) => {
    const { hyperframesRenderAdapter } = await import("@/lib/render/adapters/hyperframes");
    return hyperframesRenderAdapter.render({
      contentItemId,
      targetChannel: "tiktok",
      hook: plan.hook,
      slides: plan.scenes.map((scene) => scene.onScreenText),
      caption: plan.caption,
      ctaText: plan.cta,
      businessName: "ClipLoop",
      durationSec,
      templateId: "hf_promo_v1",
      output,
    });
  },
};

function createFallbackPlan(input: IdeaVideoInput): IdeaVideoPlan {
  const cta = input.callToAction || "Subscribe for the next practical breakdown.";
  return {
    title: input.idea.slice(0, 80),
    hook: input.idea,
    caption: input.idea,
    cta,
    scenes: [
      { purpose: "Hook", onScreenText: input.idea, narration: input.idea, visualPrompt: "High-contrast editorial image that makes the central idea immediately clear, vertical composition.", motion: "Fast push in" },
      { purpose: "Problem", onScreenText: "The usual workflow loses momentum.", narration: "Most ideas lose momentum before they become a finished video.", visualPrompt: "A dense unfinished checklist collapsing into one clear path, vertical composition.", motion: "Fast lateral slide" },
      { purpose: "Script", onScreenText: "Start with the script.", narration: "Turn the idea into a tight script with one job per beat.", visualPrompt: "A concise script card with a highlighted hook, vertical composition.", motion: "Quick push in" },
      { purpose: "Visuals", onScreenText: "Give every beat a visual.", narration: "Match each beat with a visual direction and movement cue.", visualPrompt: "A vertical storyboard of distinct visual beats, vertical composition.", motion: "Snap cut" },
      { purpose: "Proof", onScreenText: "Review the output before you publish.", narration: "Review the draft and its production plan before publishing.", visualPrompt: "A clean review screen with script, scenes, and preview, vertical composition.", motion: "Fast rack focus" },
      { purpose: "Takeaway", onScreenText: cta, narration: cta, visualPrompt: "Simple confident closing frame with ample negative space, vertical composition.", motion: "Gentle pull back" },
    ],
  };
}

function createScenePlan(plan: IdeaVideoPlan, durationSec: number): SceneBlock[] {
  const durationMs = Math.floor((durationSec * 1000) / plan.scenes.length);
  return plan.scenes.map((scene, index) => ({
    type: index === 0 ? "hook" : index === plan.scenes.length - 1 ? "cta" : "visual",
    purpose: scene.purpose,
    timing: { startMs: index * durationMs, durationMs: index === plan.scenes.length - 1 ? durationSec * 1000 - index * durationMs : durationMs },
    primaryText: scene.onScreenText,
    secondaryText: scene.narration,
    cta: index === plan.scenes.length - 1 ? plan.cta : undefined,
    assetHints: [scene.visualPrompt, `Motion: ${scene.motion}`],
  }));
}

export async function runIdeaVideoMvp(rawInput: unknown, deps: IdeaVideoDeps = defaultDeps) {
  const input = ideaVideoInputSchema.parse(rawInput);
  const plan = await deps.generateStructuredObjectFn({
    schema: ideaVideoPlanSchema,
    mockFactory: () => createFallbackPlan(input),
    prompt: [
      "Create an original vertical YouTube Short production plan.",
      "The plan must be factual to the supplied idea. Do not invent evidence, names, results, or quotes.",
      "Create 6 to 12 short scenes. Each scene needs concise on-screen text, a full narration line, an image-generation prompt, and a specific motion direction.",
      "Make scene one compelling within two seconds. Use rapid visual beats and pattern interrupts. The narration lines together must form a complete voiceover.",
      `Idea: ${input.idea}`,
      `Audience: ${input.audience || "general YouTube viewers"}`,
      `Tone: ${input.tone}`,
      `Duration: ${input.durationSec} seconds`,
      `Call to action: ${input.callToAction || "Choose a natural, low-pressure subscription CTA."}`,
    ].join("\n\n"),
  });

  const id = `idea-video-${randomUUID()}`;
  const scenePlan = createScenePlan(plan, input.durationSec);
  const output = await deps.prepareRenderOutputFn(id);
  const render = await deps.renderFn({ contentItemId: id, plan, durationSec: input.durationSec, output });
  const metadata = render.metadataJson as Record<string, unknown> | undefined;
  if (metadata?.rendererStatus === "unavailable") throw new IdeaVideoRendererUnavailableError();
  if (!render.videoUrl || !render.thumbnailUrl || !render.videoPath) throw new IdeaVideoRenderFailedError();

  const artifactDir = path.join(process.cwd(), "public", "generated", "idea-videos", id);
  await fs.mkdir(artifactDir, { recursive: true });
  const artifactUrl = `/generated/idea-videos/${id}/artifact.json`;
  await fs.writeFile(path.join(artifactDir, "artifact.json"), JSON.stringify({ id, createdAt: new Date().toISOString(), input, plan, scenePlan, render }, null, 2), "utf8");

  return {
    id,
    input,
    plan,
    scenePlan,
    preview: { videoUrl: render.videoUrl, thumbnailUrl: render.thumbnailUrl, downloadUrl: render.videoUrl },
    artifact: { artifactUrl },
  };
}
