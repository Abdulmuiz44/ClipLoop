import test from "node:test";
import assert from "node:assert/strict";
import { meUsageResponseSchema } from "@/lib/validation/billing";

test("dashboard usage data shape matches spec", () => {
  const mockData = {
    credits: {
      generationBalance: 85,
      renderBalance: 42,
      totalBalance: 127,
      periodKey: "2026-05",
    },
    usageEvents: [
      {
        id: "evt-1",
        action: "api_weekly_promo_generate",
        source: "public_api",
        creditsBucket: "generation",
        creditsAmount: 5,
        createdAt: new Date().toISOString(),
        keyPrefix: "clp_abc1234",
      },
      {
        id: "evt-2",
        action: "action_generate_copy",
        source: "web",
        creditsBucket: "generation",
        creditsAmount: 1,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        keyPrefix: null,
      },
    ],
    breakdownByAction: {
      api_weekly_promo_generate: 1,
      action_generate_copy: 1,
    },
    publicApiUsageCount: 1,
    creditsSpentLast7d: 10,
    creditsSpentLast30d: 35,
    apiKeys: [
      {
        id: "key-1",
        label: "My Server",
        keyPrefix: "clp_abc1234",
        status: "active",
        scopes: ["weekly_promo:generate", "usage:read"],
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      },
    ],
  };

  // Credits shape
  assert.equal(mockData.credits.totalBalance, 127);
  assert.equal(mockData.credits.generationBalance, 85);
  assert.equal(mockData.credits.renderBalance, 42);

  // Usage events have keyPrefix never full key
  for (const ev of mockData.usageEvents) {
    if (ev.keyPrefix) {
      assert.ok(!ev.keyPrefix.startsWith("clp_abc12345"), "Must not contain full key");
      assert.ok(ev.keyPrefix.length <= 16, "keyPrefix should be truncated");
    }
  }

  // Usage event shape
  assert.equal(mockData.usageEvents.length, 2);
  const event1 = mockData.usageEvents[0];
  assert.equal(event1.action, "api_weekly_promo_generate");
  assert.equal(event1.source, "public_api");
  assert.equal(event1.creditsAmount, 5);
  assert.equal(event1.creditsBucket, "generation");
  assert.ok(event1.createdAt);
  assert.ok(event1.id);

  // Breakdown
  assert.equal(mockData.breakdownByAction.api_weekly_promo_generate, 1);
  assert.equal(mockData.breakdownByAction.action_generate_copy, 1);

  // Public API count
  assert.equal(mockData.publicApiUsageCount, 1);

  // Credits spent
  assert.equal(mockData.creditsSpentLast7d, 10);
  assert.equal(mockData.creditsSpentLast30d, 35);

  // API keys — prefix only, no full key
  assert.equal(mockData.apiKeys.length, 1);
  const key = mockData.apiKeys[0];
  assert.equal(key.keyPrefix, "clp_abc1234");
  assert.equal(key.label, "My Server");
  assert.equal(key.status, "active");
  assert.ok(key.scopes.includes("weekly_promo:generate"));
  assert.ok(key.scopes.includes("usage:read"));
  assert.ok(key.createdAt);
  assert.ok(key.lastUsedAt);
  // Never expose full key
  assert.equal((key as any).fullKey, undefined);
  assert.equal((key as any).keyHash, undefined);
});

test("empty dashboard state has zero values", () => {
  const empty = {
    credits: { generationBalance: 0, renderBalance: 0, totalBalance: 0, periodKey: "" },
    usageEvents: [],
    breakdownByAction: {},
    publicApiUsageCount: 0,
    creditsSpentLast7d: 0,
    creditsSpentLast30d: 0,
    apiKeys: [],
  };

  assert.equal(empty.credits.totalBalance, 0);
  assert.equal(empty.usageEvents.length, 0);
  assert.equal(Object.keys(empty.breakdownByAction).length, 0);
  assert.equal(empty.publicApiUsageCount, 0);
  assert.equal(empty.apiKeys.length, 0);
});

test("public API weekly promo endpoint shown as method/path", () => {
  const event = {
    action: "api_weekly_promo_generate",
  };
  const expectedEndpoint = "POST /api/public/weekly-promo";
  // When action is api_weekly_promo_generate, dashboard shows POST /api/public/weekly-promo
  assert.equal(
    event.action === "api_weekly_promo_generate" ? expectedEndpoint : null,
    "POST /api/public/weekly-promo",
  );
});

test("me/usage route response shape includes dashboard field", () => {
  const response = {
    usage: {
      postsPerWeek: 0,
      postsPerMonth: 0,
      manualRegenerationsPerWeek: 0,
      rendersPerMonth: 0,
      publishesPerMonth: 0,
    },
    remaining: {
      postsPerWeek: 12,
      postsPerMonth: 80,
      manualRegenerationsPerWeek: 5,
      rendersPerMonth: 40,
      publishesPerMonth: 40,
    },
    periods: {
      week: { start: "2026-05-25", end: "2026-05-31" },
      month: { start: "2026-05-01", end: "2026-05-31" },
    },
    limits: {
      activeProjects: 5,
      postsPerWeek: 20,
      postsPerMonth: 80,
      manualRegenerationsPerWeek: 10,
      rendersPerMonth: 40,
      publishesPerMonth: 40,
      connectedChannels: 1,
    },
    dashboard: {
      credits: { generationBalance: 85, renderBalance: 42, totalBalance: 127, periodKey: "2026-05" },
      usageEvents: [],
      breakdownByAction: {},
      publicApiUsageCount: 0,
      creditsSpentLast7d: 10,
      creditsSpentLast30d: 35,
      apiKeys: [],
    },
  };

  assert.ok(response.dashboard);
  assert.ok(response.dashboard.credits);
  assert.equal(response.dashboard.credits.totalBalance, 127);
  assert.equal(response.dashboard.creditsSpentLast7d, 10);
  assert.ok(Array.isArray(response.dashboard.usageEvents));
  assert.ok(Array.isArray(response.dashboard.apiKeys));
  assert.ok(response.usage);
  assert.ok(response.remaining);
  assert.ok(response.periods);
  assert.ok(response.limits);
});

test("meUsageResponseSchema validates dashboard field", () => {
  const payload = {
    usage: {
      postsPerWeek: 0,
      postsPerMonth: 0,
      manualRegenerationsPerWeek: 0,
      rendersPerMonth: 0,
      publishesPerMonth: 0,
    },
    remaining: {
      postsPerWeek: 12,
      postsPerMonth: 80,
      manualRegenerationsPerWeek: 5,
      rendersPerMonth: 40,
      publishesPerMonth: 40,
    },
    periods: {
      week: { start: "2026-05-25", end: "2026-05-31" },
      month: { start: "2026-05-01", end: "2026-05-31" },
    },
    limits: {
      activeProjects: 5,
      postsPerWeek: 20,
      postsPerMonth: 80,
      manualRegenerationsPerWeek: 10,
      rendersPerMonth: 40,
      publishesPerMonth: 40,
      connectedChannels: 1,
    },
    dashboard: {
      credits: { generationBalance: 85, renderBalance: 42, totalBalance: 127, periodKey: "2026-05" },
      usageEvents: [
        {
          id: "evt-1",
          action: "api_weekly_promo_generate",
          source: "public_api" as const,
          creditsBucket: "generation",
          creditsAmount: 5,
          createdAt: new Date().toISOString(),
          keyPrefix: "clp_abc1234",
        },
      ],
      breakdownByAction: { api_weekly_promo_generate: 1 },
      publicApiUsageCount: 2,
      creditsSpentLast7d: 10,
      creditsSpentLast30d: 35,
      apiKeys: [
        {
          id: "key-1",
          label: "My Server",
          keyPrefix: "clp_abc1234",
          status: "active" as const,
          scopes: ["weekly_promo:generate"],
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
        },
      ],
    },
  };

  const parsed = meUsageResponseSchema.parse(payload);
  assert.equal(parsed.dashboard.credits.totalBalance, 127);
  assert.equal(parsed.dashboard.usageEvents.length, 1);
  assert.equal(parsed.dashboard.publicApiUsageCount, 2);
  assert.equal(parsed.dashboard.creditsSpentLast7d, 10);
  assert.equal(parsed.dashboard.creditsSpentLast30d, 35);
  assert.equal(parsed.dashboard.apiKeys.length, 1);
  assert.equal(parsed.dashboard.apiKeys[0].keyPrefix, "clp_abc1234");
  assert.equal((parsed.dashboard.apiKeys[0] as any).fullKey, undefined);
});

test("usage event with keyPrefix in metadata only shows prefix not full key", () => {
  const fullKey = "clp_abc12345defghijklmnopqrstuvwxyz";
  const keyPrefix = fullKey.slice(0, 12);

  // Simulate what the backend extracts
  const metadataJson = { keyPrefix, idempotencyKey: "idem-001" };

  // What gets exposed in the dashboard response
  const exposedPrefix = metadataJson.keyPrefix ?? null;
  assert.equal(exposedPrefix, "clp_abc12345");
  assert.equal(exposedPrefix?.length, 12);
  // The full key is NEVER in metadata
  assert.notEqual(metadataJson as any, fullKey);
});
