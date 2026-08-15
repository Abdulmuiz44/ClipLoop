import test from "node:test";
import assert from "node:assert/strict";

import { runIdeaVideoMvp } from "@/domains/idea-video/service";

test("idea video produces timed scenes, a full narration plan, and a render preview", async () => {
  const result = await runIdeaVideoMvp({ idea: "Show why a clear first sentence matters in a short educational video.", durationSec: 30 }, {
    generateStructuredObjectFn: (async ({ schema }) => schema.parse({ title: "Start clearly", hook: "Your first sentence decides whether people stay.", caption: "A better opening makes the whole lesson easier to follow.", cta: "Subscribe for more practical lessons.", scenes: [
      { purpose: "Hook", onScreenText: "Your first sentence decides whether people stay.", narration: "Your first sentence decides whether people stay.", visualPrompt: "A person stopping mid-scroll, bold editorial lighting, vertical frame.", motion: "Fast push in" },
      { purpose: "Lesson", onScreenText: "Make the value obvious.", narration: "State the useful outcome before you explain the details.", visualPrompt: "A clean note card revealing a simple outcome, vertical frame.", motion: "Slow pan right" },
      { purpose: "Example", onScreenText: "Lead with the outcome.", narration: "Give the viewer the outcome before the explanation.", visualPrompt: "A bold result card appearing before supporting detail, vertical frame.", motion: "Snap cut" },
      { purpose: "Proof", onScreenText: "Show the work.", narration: "Use a visible result to support the lesson.", visualPrompt: "A clean work sample with one detail highlighted, vertical frame.", motion: "Quick push in" },
      { purpose: "Takeaway", onScreenText: "Make it easy to follow.", narration: "Keep each beat focused on one useful point.", visualPrompt: "A simple path through a visual lesson, vertical frame.", motion: "Fast pan left" },
      { purpose: "CTA", onScreenText: "Subscribe for more practical lessons.", narration: "Subscribe for more practical lessons.", visualPrompt: "Minimal closing frame with space for text, vertical frame.", motion: "Gentle pull back" },
    ] })) as any,
    prepareRenderOutputFn: async () => ({ runDir: "/tmp", videoFileName: "video.mp4", thumbnailFileName: "thumbnail.jpg", videoPath: "/tmp/video.mp4", thumbnailPath: "/tmp/thumbnail.jpg", videoUrl: "/generated/test/video.mp4", thumbnailUrl: "/generated/test/thumbnail.jpg" }),
    renderFn: async () => ({ renderer: "hyperframes", templateId: "hf_promo_v1", durationSec: 30, width: 1080, height: 1920, videoPath: "/tmp/video.mp4", thumbnailPath: "/tmp/thumbnail.jpg", videoUrl: "/generated/test/video.mp4", thumbnailUrl: "/generated/test/thumbnail.jpg", metadataJson: {} }),
  });

  assert.equal(result.plan.scenes.length, 6);
  assert.equal(result.scenePlan[0].timing.startMs, 0);
  assert.equal(result.scenePlan[5].timing.durationMs, 5000);
  assert.match(result.plan.scenes.map((scene) => scene.narration).join(" "), /first sentence/i);
  assert.equal(result.preview.videoUrl, "/generated/test/video.mp4");
});
