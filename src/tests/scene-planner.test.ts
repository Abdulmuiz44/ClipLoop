import test from "node:test";
import assert from "node:assert/strict";

import { generateScenePlan } from "@/lib/prompts/scenePlanner";

test("scene planner fills the requested runtime with contiguous short-form beats", () => {
  const scenes = generateScenePlan({
    concept: "A proof-led short",
    objective: "Explain one useful workflow.",
    targetChannel: "tiktok",
    stylePreset: "hook_burst",
    recommendedTemplateFamily: "hook_burst",
    cta: "Try it now",
    tone: "direct",
    durationSec: 30,
    sceneOutline: "1. Hook: Stop losing attribution\n2. Problem: The click loses context\n3. Fix: Capture it on landing\n4. Proof: Store it at signup\n5. CTA: Try it now",
  });

  assert.equal(scenes.length, 5);
  assert.equal(scenes[0].timing.startMs, 0);
  assert.equal(scenes[1].timing.startMs, scenes[0].timing.durationMs);
  const lastScene = scenes.at(-1);
  assert.ok(lastScene);
  assert.equal(lastScene.timing.startMs + lastScene.timing.durationMs, 30000);
});
