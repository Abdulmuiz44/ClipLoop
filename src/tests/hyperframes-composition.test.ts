import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { buildHyperframesComposition } from "@/lib/render/hyperframes/composition";
import { renderTemplates } from "@/lib/render/templates";

test("hyperframes composition applies template styling and scene plan summary", async () => {
  const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "cliplane-hf-"));

  const result = await buildHyperframesComposition({
    runDir,
    renderTemplate: renderTemplates.offer_drop,
    input: {
      contentItemId: "item_123",
      businessName: "Talocode",
      hook: "Weekend promo live",
      channelCaption: "Default caption",
      channelCta: "Send us a DM",
      targetChannel: "instagram",
      stylePreset: "offer_drop",
      templateFamily: "offer_drop_template",
      durationSec: 6,
      tone: "bold",
      visualNotes: "High-energy",
      scenePlan: [
        {
          type: "text",
          purpose: "Hook",
          timing: { startMs: 0, durationMs: 2000 },
          primaryText: "50% off today",
        },
        {
          type: "text",
          purpose: "Proof",
          timing: { startMs: 2000, durationMs: 2000 },
          primaryText: "Trusted by 1,000+ buyers",
        },
      ],
    },
  });

  const html = await fs.readFile(result.compositionHtmlPath, "utf8");
  const metadataRaw = await fs.readFile(result.metadataPath, "utf8");
  const metadata = JSON.parse(metadataRaw) as { scenePlan: unknown[]; durationSec: number };

  assert.match(html, /linear-gradient\(180deg, #28a745 0%, #28a745 100%\)/);
  assert.match(html, /font-size: 70px;/);
  assert.match(html, /color: #1e7e34;/);
  assert.match(html, /Scene flow: 1\. 50% off today • 2\. Trusted by 1,000\+ buyers/);
  assert.match(html, /<div class="caption">1\. 50% off today • 2\. Trusted by 1,000\+ buyers<\/div>/);
  assert.match(html, /animation: scene-cycle/);
  assert.match(html, /animation: copy-punch/);
  assert.match(html, /class="scene-block scene-variant-0"/);
  assert.match(html, /--scene-start-ms:0;--scene-duration-ms:2000;/);
  assert.match(html, /--scene-start-ms:2000;--scene-duration-ms:2000;/);
  assert.match(html, /<div class="scene-primary">50% off today<\/div>/);
  assert.match(html, /<div class="scene-primary">Trusted by 1,000\+ buyers<\/div>/);
  assert.doesNotMatch(html, /\{\{SCENE_BLOCKS\}\}/);
  assert.equal(metadata.scenePlan.length, 2);
  assert.equal(metadata.durationSec, 6);
});

test("hyperframes composition falls back to caption when no scene plan", async () => {
  const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "cliplane-hf-"));

  const result = await buildHyperframesComposition({
    runDir,
    renderTemplate: renderTemplates.clean_dark,
    input: {
      contentItemId: "item_456",
      businessName: "Talocode",
      hook: "Launch week",
      channelCaption: "Simple caption fallback",
      channelCta: "Get started",
      targetChannel: "whatsapp",
      stylePreset: "clean_dark",
      templateFamily: "hook_burst",
      durationSec: 4,
      tone: "calm",
      scenePlan: [],
    },
  });

  const html = await fs.readFile(result.compositionHtmlPath, "utf8");

  assert.match(html, /<div class="caption">Simple caption fallback<\/div>/);
  assert.match(html, /Scene flow: Simple caption fallback/);
  assert.match(html, /class="scene-block is-static"/);
  assert.doesNotMatch(html, /\{\{DURATION_SEC\}\}/);
});
