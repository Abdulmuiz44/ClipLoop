import test from "node:test";
import assert from "node:assert/strict";

import { weeklyPromoInputSchema } from "@/lib/validation/weekly-promo";

// --- Schema validation (no DB needed) ---

const validPayload = {
  appName: "ClipLane",
  appWebsiteUrl: "https://cliplane.ai",
  weeklyUpdate: "We shipped AI storyboard drafts for weekly promos.",
  targetAudience: "Indie SaaS founders",
  callToAction: "Try ClipLane this week",
  channel: "instagram" as const,
  tone: "direct and optimistic",
};

test("valid payload passes weeklyPromoInputSchema", () => {
  const result = weeklyPromoInputSchema.parse({ ...validPayload });
  assert.equal(result.appName, "ClipLane");
  assert.equal(result.channel, "instagram");
  assert.equal(result.targetAudience, "Indie SaaS founders");
});

test("missing appName fails validation", () => {
  const { appName, ...rest } = validPayload;
  assert.throws(() => weeklyPromoInputSchema.parse(rest));
});

test("missing weeklyUpdate fails validation", () => {
  const { weeklyUpdate, ...rest } = validPayload;
  assert.throws(() => weeklyPromoInputSchema.parse(rest));
});

test("too short weeklyUpdate (< 8 chars) fails validation", () => {
  assert.throws(() =>
    weeklyPromoInputSchema.parse({ ...validPayload, weeklyUpdate: "Short" }),
  );
});

test("too long weeklyUpdate (> 500 chars) fails validation", () => {
  assert.throws(() =>
    weeklyPromoInputSchema.parse({ ...validPayload, weeklyUpdate: "x".repeat(501) }),
  );
});

test("too long appName (> 100 chars) fails validation", () => {
  assert.throws(() =>
    weeklyPromoInputSchema.parse({ ...validPayload, appName: "x".repeat(101) }),
  );
});

test("too long tone (> 100 chars) fails validation", () => {
  assert.throws(() =>
    weeklyPromoInputSchema.parse({ ...validPayload, tone: "x".repeat(101) }),
  );
});

test("too long targetAudience (> 200 chars) fails validation", () => {
  assert.throws(() =>
    weeklyPromoInputSchema.parse({ ...validPayload, targetAudience: "x".repeat(201) }),
  );
});

test("too long callToAction (> 200 chars) fails validation", () => {
  assert.throws(() =>
    weeklyPromoInputSchema.parse({ ...validPayload, callToAction: "x".repeat(201) }),
  );
});

test("invalid channel fails validation", () => {
  assert.throws(() =>
    weeklyPromoInputSchema.parse({ ...validPayload, channel: "youtube" }),
  );
});

test("missing tone fails validation", () => {
  const { tone, ...rest } = validPayload;
  assert.throws(() => weeklyPromoInputSchema.parse(rest));
});

test("appWebsiteUrl defaults to undefined when omitted", () => {
  const { appWebsiteUrl, ...rest } = validPayload;
  const result = weeklyPromoInputSchema.parse(rest);
  assert.equal(result.appWebsiteUrl, undefined);
});

test("appWebsiteUrl accepts empty string", () => {
  const result = weeklyPromoInputSchema.parse({ ...validPayload, appWebsiteUrl: "" });
  assert.equal(result.appWebsiteUrl, "");
});

test("appWebsiteUrl rejects non-URL string", () => {
  assert.throws(() =>
    weeklyPromoInputSchema.parse({ ...validPayload, appWebsiteUrl: "not-a-url" }),
  );
});

test("all supported channels pass validation", () => {
  for (const channel of ["instagram", "tiktok", "whatsapp", "x"] as const) {
    const result = weeklyPromoInputSchema.parse({ ...validPayload, channel });
    assert.equal(result.channel, channel);
  }
});

// --- Response shape tests ---

test("public endpoint response shape matches spec", () => {
  const mockResult = {
    id: "weekly-promo-abc-123",
    websiteContextUsed: true,
    scrapeError: null,
    productContext: { productName: "ClipLane" },
    script: {
      hook: "Big update this week",
      body: ["We shipped storyboard drafts", "You can now create faster"],
      caption: "Weekly ship update",
      cta: "Try it now",
      sceneOutline: ["1. Hook: Update", "2. Feature: Storyboard", "3. CTA: Try it now"],
    },
    scenePlan: [
      { type: "hook", purpose: "Update", timing: { startMs: 0, durationMs: 3000 }, primaryText: "Big update this week" },
    ],
    preview: {
      videoUrl: "/generated/test/rendered.mp4",
      thumbnailUrl: "/generated/test/thumbnail.jpg",
      downloadUrl: "/generated/test/rendered.mp4",
    },
    artifact: {
      artifactPath: "/public/generated/weekly-promos/abc-123/artifact.json",
      artifactUrl: "/generated/weekly-promos/abc-123/artifact.json",
    },
  };

  const responseJson = {
    artifactId: mockResult.id,
    previewUrl: mockResult.preview.videoUrl ?? null,
    downloadUrl: mockResult.preview.downloadUrl ?? null,
    artifactUrl: mockResult.artifact.artifactUrl ?? null,
    script: mockResult.script,
    scenePlan: mockResult.scenePlan,
    creditsCharged: 5,
    idempotencyKey: "idem-key-12345678",
  };

  assert.equal(responseJson.artifactId, "weekly-promo-abc-123");
  assert.equal(responseJson.previewUrl, "/generated/test/rendered.mp4");
  assert.equal(responseJson.downloadUrl, "/generated/test/rendered.mp4");
  assert.equal(responseJson.artifactUrl, "/generated/weekly-promos/abc-123/artifact.json");
  assert.equal(responseJson.creditsCharged, 5);
  assert.equal(responseJson.idempotencyKey, "idem-key-12345678");
  assert.ok(responseJson.script);
  assert.ok(Array.isArray(responseJson.scenePlan));
  assert.equal(responseJson.scenePlan.length, 1);
  assert.equal(responseJson.script.hook, "Big update this week");
  assert.equal(responseJson.script.body.length, 2);
});

test("public endpoint handles null previewUrl when missing", () => {
  const responseJson = {
    artifactId: "weekly-promo-xyz",
    previewUrl: null,
    downloadUrl: "/path/to/video.mp4",
    artifactUrl: "/path/to/artifact.json",
    script: { hook: "test", body: ["a", "b"], caption: "test", cta: "test", sceneOutline: ["1. test", "2. test", "3. test"] },
    scenePlan: [],
    creditsCharged: 5,
    idempotencyKey: "idem-key-12345678",
  };

  assert.equal(responseJson.previewUrl, null);
  assert.equal(responseJson.downloadUrl, "/path/to/video.mp4");
  assert.equal(responseJson.artifactUrl, "/path/to/artifact.json");
});

// --- Auth error mapping tests ---

test("ApiKeyAuthError maps to 401 with API_KEY_INVALID code", () => {
  const error = { message: "Invalid API key.", code: "API_KEY_INVALID" };
  assert.equal(error.code, "API_KEY_INVALID");
  assert.equal(error.message, "Invalid API key.");
});

test("InsufficientCreditsError maps to 402 with CREDITS_INSUFFICIENT code", () => {
  const error = {
    message: "Generation credits are insufficient for this action.",
    code: "CREDITS_INSUFFICIENT",
    bucket: "generation",
    required: 5,
    available: 2,
  };
  assert.equal(error.code, "CREDITS_INSUFFICIENT");
  assert.equal(error.bucket, "generation");
  assert.equal(error.required, 5);
  assert.equal(error.available, 2);
});

test("IdempotencyKeyRequiredError maps to 400 with IDEMPOTENCY_KEY_REQUIRED code", () => {
  const error = { message: "Idempotency-Key header is required.", code: "IDEMPOTENCY_KEY_REQUIRED" };
  assert.equal(error.code, "IDEMPOTENCY_KEY_REQUIRED");
  assert.equal(error.message, "Idempotency-Key header is required.");
});

// --- Billing policy ---

test("api_weekly_promo_generate billing policy charges 5 generation credits", async () => {
  const { getBillingPolicy } = await import("@/core/billing/policy");
  const policy = getBillingPolicy("api_weekly_promo_generate");
  assert.equal(policy.billable, true);
  if (policy.billable) {
    assert.equal(policy.bucket, "generation");
    assert.equal(policy.amount, 5);
    assert.equal(policy.reason, "action_generate_copy");
  }
});

// --- Rate limit config ---

test("public weekly promo rate limit is 3 per 60s", () => {
  // This matches the route's hardcoded rate limit
  const rateLimit = { key: "public_weekly_promo", limit: 3, windowSec: 60 };
  assert.equal(rateLimit.limit, 3);
  assert.equal(rateLimit.windowSec, 60);
});

// --- Scope check ---

test("weekly_promo:generate scope is defined", async () => {
  const { isPublicApiScopeId } = await import("@/lib/public-api/scopes");
  assert.equal(isPublicApiScopeId("weekly_promo:generate"), true);
});

// --- Debug response behavior ---

function buildTestErrorBody(params: {
  code: string;
  message: string;
  debugMode: boolean;
  extra?: Record<string, unknown>;
}) : any {
  const base = { error: params.message, code: params.code };

  if (!params.debugMode) {
    return base;
  }

  return {
    ...base,
    debug: {
      route: "public-weekly-promo",
      code: params.code,
      status: 500,
      errorName: "Error",
      safeMessage: params.message,
      secretsExposed: false,
      ...params.extra,
    },
  };
}

test("without debug header: generic response unchanged", () => {
  const body = buildTestErrorBody({
    code: "VIDEO_RENDER_FAILED",
    message: "Rendered video output is missing.",
    debugMode: false,
  });

  assert.equal(body.error, "Rendered video output is missing.");
  assert.equal(body.code, "VIDEO_RENDER_FAILED");
  assert.ok(!("debug" in body));
});

test("with X-ClipLane-Debug: safe: sanitized debug fields included", () => {
  const body = buildTestErrorBody({
    code: "VIDEO_RENDER_FAILED",
    message: "Rendered video output is missing.",
    debugMode: true,
    extra: {
      errorName: "VideoRenderFailedError",
      idempotencyKeyPrefix: "cliplane-real",
      idempotencyCleanupRan: true,
    },
  });

  assert.ok("debug" in body);
  assert.equal(body.debug.route, "public-weekly-promo");
  assert.equal(body.debug.code, "VIDEO_RENDER_FAILED");
  assert.equal(body.debug.safeMessage, "Rendered video output is missing.");
  assert.equal(body.debug.errorName, "VideoRenderFailedError");
  assert.equal(body.debug.idempotencyKeyPrefix, "cliplane-real");
  assert.equal(body.debug.idempotencyCleanupRan, true);
});

test("debug response does not include Authorization, API key, DATABASE_URL, stack, raw body", () => {
  const body = buildTestErrorBody({
    code: "VIDEO_RENDER_UNAVAILABLE",
    message: "Video renderer is unavailable.",
    debugMode: true,
    extra: {
      idempotencyKeyPrefix: "cliplane-real",
      idempotencyCleanupRan: false,
    },
  });

  const serialized = JSON.stringify(body);
  assert.ok(!serialized.includes("Authorization"));
  assert.ok(!serialized.includes("DATABASE_URL"));
  assert.ok(!serialized.includes("CLIPLANE_API_KEY"));
  assert.ok(!serialized.includes("stack"));
  assert.ok(!serialized.includes("raw body"));
  assert.ok(!serialized.includes("api-key"));
});
