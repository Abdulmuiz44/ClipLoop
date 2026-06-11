import test from "node:test";
import assert from "node:assert/strict";

import {
  createDraftPromoBrief,
  parsePromoBrief,
  promoBriefToPlanningContext,
  validatePromoBrief,
  type CreatePromoBriefDraftInput,
} from "@/domains/promo-brief";

const validDraftInput: CreatePromoBriefDraftInput = {
  projectId: "proj_abc123",
  source: {
    type: "product_update",
    rawText: "We shipped AI storyboard drafts for weekly promos.",
  },
  product: {
    name: "ClipLoop",
    oneLine: "Create weekly promo videos without hiring an editor",
    targetAudience: "Indie SaaS founders",
    category: "Marketing automation",
  },
  message: {
    primaryPromise: "Ship social promos every week in minutes",
    painPoint: "Founders waste hours on video edits instead of building",
    featureHighlights: ["AI storyboard drafts", "One-click weekly promo"],
    proofPoints: ["Used by 200+ indie teams"],
    callToAction: "Try ClipLoop this week",
  },
  creative: {
    tone: "bold",
    platform: "instagram_reels",
    durationSeconds: 30,
    aspectRatio: "9:16",
  },
  constraints: {
    mustInclude: ["storyboard drafts"],
    mustAvoid: ["generic stock footage"],
    brandTerms: ["ClipLoop"],
  },
};

test("valid promo brief passes validation", () => {
  const brief = createDraftPromoBrief(validDraftInput);
  const parsed = parsePromoBrief(brief);
  const validated = validatePromoBrief(brief);

  assert.equal(parsed.id, brief.id);
  assert.equal(parsed.projectId, "proj_abc123");
  assert.equal(validated.success, true);
  if (validated.success) {
    assert.equal(validated.data.product.name, "ClipLoop");
  }
});

test("missing product name fails validation", () => {
  const result = validatePromoBrief({
    ...createDraftPromoBrief(validDraftInput),
    product: {
      ...validDraftInput.product,
      name: "",
    },
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error.message, /Product name is required|name/i);
  }
});

test("empty featureHighlights fails validation", () => {
  const result = validatePromoBrief({
    ...createDraftPromoBrief(validDraftInput),
    message: {
      ...validDraftInput.message,
      featureHighlights: [],
    },
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error.message, /feature highlight/i);
  }
});

test("unsupported platform fails validation", () => {
  const result = validatePromoBrief({
    ...createDraftPromoBrief(validDraftInput),
    creative: {
      ...validDraftInput.creative,
      platform: "facebook",
    },
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error.message, /platform/i);
  }
});

test("duration must be one of allowed values", () => {
  const result = validatePromoBrief({
    ...createDraftPromoBrief(validDraftInput),
    creative: {
      ...validDraftInput.creative,
      durationSeconds: 90,
    },
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error.message, /durationSeconds/i);
  }
});

test("aspect ratio must be valid", () => {
  const result = validatePromoBrief({
    ...createDraftPromoBrief(validDraftInput),
    creative: {
      ...validDraftInput.creative,
      aspectRatio: "4:5",
    },
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error.message, /aspectRatio/i);
  }
});

test("promoBriefToPlanningContext returns compact planning text", () => {
  const brief = createDraftPromoBrief(validDraftInput);
  const context = promoBriefToPlanningContext(brief);

  assert.match(context, /^# Promo Brief/);
  assert.match(context, /Product: ClipLoop/);
  assert.match(context, /Audience: Indie SaaS founders/);
  assert.match(context, /Promise: Ship social promos every week in minutes/);
  assert.match(context, /Features: AI storyboard drafts; One-click weekly promo/);
  assert.match(context, /CTA: Try ClipLoop this week/);
  assert.match(context, /Platform: instagram_reels/);
  assert.match(context, /Duration: 30s/);
  assert.match(context, /Must include: storyboard drafts/);
  assert.match(context, /Source \(product_update\):/);
});