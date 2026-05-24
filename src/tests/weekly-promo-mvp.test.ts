import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";

import { runWeeklyPromoMvp } from "@/domains/weekly-promo/service";
import type { SceneBlock } from "@/lib/render/hyperframes/types";

const baseInput = {
  appName: "ClipLoop",
  appWebsiteUrl: "https://cliploop.ai",
  weeklyUpdate: "We shipped AI storyboard drafts for weekly promos.",
  targetAudience: "Indie SaaS founders",
  callToAction: "Try ClipLoop this week",
  channel: "instagram" as const,
  tone: "direct and optimistic",
};

test("weekly promo falls back when website scraping fails", async () => {
  const result = await runWeeklyPromoMvp(baseInput, {
    extractWebsiteTextFn: async () => {
      throw new Error("Network timeout");
    },
    generateStructuredObjectFn: (async ({ schema, prompt }) => {
      if (prompt.includes("Create a short weekly promo script")) {
        return schema.parse({
          hook: "Big update this week",
          body: ["We shipped storyboard drafts", "You can now create faster"],
          caption: "Weekly ship update",
          cta: "Try it now",
          sceneOutline: ["1. Hook: Update", "2. Feature: Storyboard", "3. CTA: Try it now"],
        });
      }
      throw new Error("Unexpected product-context extraction call");
    }) as any,
    generateScenePlanFn: () =>
      [
        { type: "hook", purpose: "Update", timing: { startMs: 0, durationMs: 3000 }, primaryText: "Big update this week" },
      ] satisfies SceneBlock[],
    prepareRenderOutputFn: async () => ({
      runDir: "/tmp",
      videoFileName: "rendered.mp4",
      thumbnailFileName: "thumbnail.jpg",
      videoPath: "/tmp/rendered.mp4",
      thumbnailPath: "/tmp/thumbnail.jpg",
      videoUrl: "/generated/test/rendered.mp4",
      thumbnailUrl: "/generated/test/thumbnail.jpg",
    }),
    renderFn: async () => ({
      renderer: "hyperframes",
      templateId: "hf_promo_v1",
      durationSec: 12,
      width: 1080,
      height: 1920,
      videoPath: "/tmp/rendered.mp4",
      videoUrl: "/generated/test/rendered.mp4",
      thumbnailPath: "/tmp/thumbnail.jpg",
      thumbnailUrl: "/generated/test/thumbnail.jpg",
      metadataJson: {},
    }),
  });

  assert.equal(result.websiteContextUsed, false);
  assert.match(result.scrapeError || "", /Network timeout/);
  assert.equal(result.preview.downloadUrl, "/generated/test/rendered.mp4");
});

test("weekly promo script prompt keeps weekly update as primary topic and includes product context", async () => {
  const prompts: string[] = [];

  await runWeeklyPromoMvp(baseInput, {
    extractWebsiteTextFn: async () => ({
      websiteUrl: "https://cliploop.ai",
      extractedText: "ClipLoop helps teams create weekly short videos.",
    }),
    generateStructuredObjectFn: (async ({ schema, prompt }) => {
      prompts.push(prompt);
      if (prompt.includes("Extract structured product context")) {
        return schema.parse({
          productName: "ClipLoop",
          oneLineDescription: "Create weekly promo videos quickly",
          targetUsers: ["Founders"],
          mainBenefits: ["Speed"],
          keyFeatures: ["Storyboard AI"],
          ctaLanguage: ["Try ClipLoop this week"],
          toneHints: ["direct"],
        });
      }
      return schema.parse({
        hook: "Weekly update is live",
        body: ["Storyboard AI shipped", "Faster weekly promo loop"],
        caption: "Weekly update",
        cta: "Try ClipLoop this week",
        sceneOutline: ["1. Hook: Weekly update", "2. Feature: Storyboard", "3. CTA: Try now"],
      });
    }) as any,
    generateScenePlanFn: () =>
      [
        { type: "hook", purpose: "Weekly", timing: { startMs: 0, durationMs: 3000 }, primaryText: "Weekly update is live" },
      ] satisfies SceneBlock[],
    prepareRenderOutputFn: async () => ({
      runDir: "/tmp",
      videoFileName: "rendered.mp4",
      thumbnailFileName: "thumbnail.jpg",
      videoPath: "/tmp/rendered.mp4",
      thumbnailPath: "/tmp/thumbnail.jpg",
      videoUrl: "/generated/test/rendered.mp4",
      thumbnailUrl: "/generated/test/thumbnail.jpg",
    }),
    renderFn: async () => ({
      renderer: "hyperframes",
      templateId: "hf_promo_v1",
      durationSec: 12,
      width: 1080,
      height: 1920,
      videoPath: "/tmp/rendered.mp4",
      videoUrl: "/generated/test/rendered.mp4",
      thumbnailPath: "/tmp/thumbnail.jpg",
      thumbnailUrl: "/generated/test/thumbnail.jpg",
      metadataJson: {},
    }),
  });

  const scriptPrompt = prompts.find((p) => p.includes("Create a short weekly promo script")) || "";
  assert.match(scriptPrompt, /weeklyUpdate is the primary topic/i);
  assert.match(scriptPrompt, /We shipped AI storyboard drafts for weekly promos\./);
  assert.match(scriptPrompt, /Supporting product context:/);
});

test("weekly promo builds scene plan, returns render preview, and saves artifact", async () => {
  const seen: { sceneOutline?: string; renderContentId?: string; renderChannel?: string } = {};

  const result = await runWeeklyPromoMvp({ ...baseInput, channel: "x" }, {
    extractWebsiteTextFn: async () => ({
      websiteUrl: "https://cliploop.ai",
      extractedText: "ClipLoop helps teams create weekly short videos.",
    }),
    generateStructuredObjectFn: (async ({ schema, prompt }) => {
      if (prompt.includes("Extract structured product context")) {
        return schema.parse({
          productName: "ClipLoop",
          oneLineDescription: "Create weekly promo videos quickly",
          targetUsers: ["Founders"],
          mainBenefits: ["Speed"],
          keyFeatures: ["Storyboard AI"],
          ctaLanguage: ["Try ClipLoop this week"],
          toneHints: ["direct"],
        });
      }
      return schema.parse({
        hook: "Weekly update is live",
        body: ["Storyboard AI shipped", "Faster weekly promo loop"],
        caption: "Weekly update",
        cta: "Try ClipLoop this week",
        sceneOutline: ["1. Hook: Weekly update", "2. Feature: Storyboard", "3. CTA: Try now"],
      });
    }) as any,
    generateScenePlanFn: (brief: { sceneOutline?: string }) => {
      seen.sceneOutline = brief.sceneOutline;
      return [
        { type: "hook", purpose: "Weekly", timing: { startMs: 0, durationMs: 3000 }, primaryText: "Weekly update is live" },
        { type: "cta", purpose: "CTA", timing: { startMs: 3000, durationMs: 3000 }, primaryText: "Try ClipLoop this week" },
      ];
    },
    prepareRenderOutputFn: async (contentItemId) => ({
      runDir: "/tmp",
      videoFileName: "rendered.mp4",
      thumbnailFileName: "thumbnail.jpg",
      videoPath: `/tmp/${contentItemId}.mp4`,
      thumbnailPath: `/tmp/${contentItemId}.jpg`,
      videoUrl: `/generated/test/${contentItemId}.mp4`,
      thumbnailUrl: `/generated/test/${contentItemId}.jpg`,
    }),
    renderFn: async ({ contentItemId, output, channel }) => {
      seen.renderContentId = contentItemId;
      seen.renderChannel = channel;
      return {
        renderer: "hyperframes",
        templateId: "hf_promo_v1",
        durationSec: 12,
        width: 1080,
        height: 1920,
        videoPath: output.videoPath,
        videoUrl: output.videoUrl,
        thumbnailPath: output.thumbnailPath,
        thumbnailUrl: output.thumbnailUrl,
        metadataJson: {},
      };
    },
  });

  assert.match(seen.sceneOutline || "", /1\. Hook: Weekly update/);
  assert.ok(seen.renderContentId?.startsWith("weekly-promo-"));
  assert.equal(seen.renderChannel, "tiktok");
  assert.match(result.preview.videoUrl, /\/generated\/test\/weekly-promo-/);

  const artifactPath = `${process.cwd()}${result.artifact.artifactUrl.replace(/^\/generated/, "/public/generated")}`;
  const artifactRaw = await fs.readFile(artifactPath, "utf8");
  const artifact = JSON.parse(artifactRaw) as {
    scenePlan: unknown[];
    websiteContextUsed: boolean;
    inputSnapshot?: {
      appName?: string;
      appWebsiteUrl?: string;
      weeklyUpdate?: string;
      targetAudience?: string;
      callToAction?: string;
      channel?: string;
      tone?: string;
    };
  };
  assert.equal(Array.isArray(artifact.scenePlan), true);
  assert.equal(artifact.websiteContextUsed, true);
  assert.equal(artifact.inputSnapshot?.appName, baseInput.appName);
  assert.equal(artifact.inputSnapshot?.appWebsiteUrl, baseInput.appWebsiteUrl);
  assert.equal(artifact.inputSnapshot?.weeklyUpdate, baseInput.weeklyUpdate);
  assert.equal(artifact.inputSnapshot?.targetAudience, baseInput.targetAudience);
  assert.equal(artifact.inputSnapshot?.callToAction, baseInput.callToAction);
  assert.equal(artifact.inputSnapshot?.channel, "x");
  assert.equal(artifact.inputSnapshot?.tone, baseInput.tone);
});
