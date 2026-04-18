import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "../lib/db";
import { chargeCredits, InsufficientCreditsError } from "../domains/credits/service";
import { generatePostsForStrategyCycle, regenerateSingleContentItem } from "../domains/content-items/service";
import { renderContentItem } from "../domains/rendering/service";
import { generateNextFromCycle } from "../domains/iteration/service";

type Fixture = {
  userId: string;
  projectId: string;
  strategyCycleId: string;
};

let cachedEnvironmentReady: boolean | null = null;

async function isEnvironmentReady() {
  if (cachedEnvironmentReady !== null) return cachedEnvironmentReady;

  try {
    await db.execute(sql`select 1`);
    const requiredTables = ["users", "projects", "strategy_cycles", "content_items", "credit_accounts", "credit_ledger_entries"];
    const rows = await db.execute<{ table_name: string }>(
      sql`select table_name from information_schema.tables where table_schema = 'public' and table_name in (${sql.join(requiredTables.map((name) => sql`${name}`), sql`,`)})`,
    );
    cachedEnvironmentReady = rows.rows.length === requiredTables.length;
    return cachedEnvironmentReady;
  } catch {
    cachedEnvironmentReady = false;
    return false;
  }
}

function uniqueEmail(tag: string) {
  return `billing-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function createFixture(tag: string): Promise<Fixture> {
  const [user] = await db
    .insert(schema.users)
    .values({
      email: uniqueEmail(tag),
      fullName: "Billing Test",
      plan: "free",
    })
    .returning();

  const [project] = await db
    .insert(schema.projects)
    .values({
      userId: user.id,
      name: `Project ${tag}`,
      productName: "ClipLoop Test Product",
      description: "Billing integration test project description",
      audience: "Founders",
      niche: "SaaS",
      offer: "One-click weekly promo loop",
      ctaUrl: "https://example.com/offer",
      goalType: "clicks",
      status: "active",
      preferredChannelsJson: ["instagram"],
    })
    .returning();

  const now = new Date();
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  const [cycle] = await db
    .insert(schema.strategyCycles)
    .values({
      projectId: project.id,
      weekStart,
      weekEnd,
      source: "initial",
      strategySummary: "Weekly promo strategy for billing tests.",
      anglesJson: [{ angle: "offer-led" }],
      llmProvider: "mock",
      llmModel: "mock-deterministic",
      promptVersion: "test",
      status: "ready",
    })
    .returning();

  return { userId: user.id, projectId: project.id, strategyCycleId: cycle.id };
}

async function cleanupFixture(fixture: Fixture) {
  await db.delete(schema.users).where(eq(schema.users.id, fixture.userId));
}

async function getLedgerEntriesByReference(userId: string, referenceType: string, referenceId: string) {
  return db.query.creditLedgerEntries.findMany({
    where: and(
      eq(schema.creditLedgerEntries.userId, userId),
      eq(schema.creditLedgerEntries.referenceType, referenceType),
      eq(schema.creditLedgerEntries.referenceId, referenceId),
    ),
  });
}

async function createContentItem(projectId: string, strategyCycleId: string) {
  const [item] = await db
    .insert(schema.contentItems)
    .values({
      projectId,
      strategyCycleId,
      platform: "instagram",
      targetChannel: "instagram",
      publishStrategy: "direct_instagram",
      manualPublishStatus: "ready_for_export",
      contentType: "slideshow_video",
      internalTitle: "Billing test content item",
      angle: "offer-led",
      hook: "Test hook for billing integration",
      slidesJson: ["Slide 1", "Slide 2", "Slide 3"],
      caption: "Caption for billing integration test",
      channelCaptionsJson: { instagram: "Caption for billing integration test" },
      hashtagsJson: ["#test"],
      ctaText: "Try now",
      channelCtaTextJson: { instagram: "Try now" },
      destinationUrl: "https://example.com/offer",
      trackingSlug: `tracking-${randomUUID()}`,
      templateId: "clean_dark",
      renderStatus: "pending",
      publishStatus: "draft",
    })
    .returning();
  return item;
}

test("generate-posts charges once and retries reuse the same ledger reference", async (t) => {
  if (!(await isEnvironmentReady())) {
    t.skip("Postgres or required migrated tables are unavailable for billing integration tests.");
    return;
  }
  const fixture = await createFixture("generate-posts");
  try {
    const first = await generatePostsForStrategyCycle(fixture.strategyCycleId);
    assert.equal(first.length, 5);

    const firstLedger = await getLedgerEntriesByReference(fixture.userId, "strategy_cycle_generate_posts", fixture.strategyCycleId);
    assert.equal(firstLedger.length, 1);
    assert.equal(firstLedger[0].amountDelta, -5);

    await db.delete(schema.contentItems).where(eq(schema.contentItems.strategyCycleId, fixture.strategyCycleId));

    const second = await generatePostsForStrategyCycle(fixture.strategyCycleId);
    assert.equal(second.length, 5);

    const secondLedger = await getLedgerEntriesByReference(fixture.userId, "strategy_cycle_generate_posts", fixture.strategyCycleId);
    assert.equal(secondLedger.length, 1);

    const usageRows = await db.query.usageCounters.findMany({
      where: and(eq(schema.usageCounters.userId, fixture.userId), eq(schema.usageCounters.periodType, "month")),
    });
    const monthlyGenerated = usageRows.reduce((sum, row) => sum + row.postsGenerated, 0);
    assert.ok(monthlyGenerated >= 10, "Usage counters should continue updating for reporting.");

    const [nextCycle] = await db
      .insert(schema.strategyCycles)
      .values({
        projectId: fixture.projectId,
        weekStart: new Date(Date.UTC(2099, 0, 1)),
        weekEnd: new Date(Date.UTC(2099, 0, 7)),
        source: "initial",
        strategySummary: "Second cycle for affordability test",
        anglesJson: [{ angle: "second-cycle" }],
        llmProvider: "mock",
        llmModel: "mock-deterministic",
        promptVersion: "test",
        status: "ready",
      })
      .returning();

    await chargeCredits({
      userId: fixture.userId,
      bucket: "generation",
      amount: 7,
      reason: "manual_adjustment",
      referenceType: "test_drain_generation",
      referenceId: nextCycle.id,
      metadata: { source: "integration_test" },
    });

    await assert.rejects(
      () => generatePostsForStrategyCycle(nextCycle.id),
      (error: unknown) => error instanceof InsufficientCreditsError && error.bucket === "generation",
    );
  } finally {
    await cleanupFixture(fixture);
  }
});

test("regenerate uses idempotent charging reference and does not double-charge on retry", async (t) => {
  if (!(await isEnvironmentReady())) {
    t.skip("Postgres or required migrated tables are unavailable for billing integration tests.");
    return;
  }
  const fixture = await createFixture("regenerate");
  try {
    const source = await createContentItem(fixture.projectId, fixture.strategyCycleId);
    const first = await regenerateSingleContentItem(source.id);
    const second = await regenerateSingleContentItem(source.id);

    assert.equal(second.id, first.id);

    const ledgerEntries = await getLedgerEntriesByReference(fixture.userId, "content_item_regenerate", source.id);
    assert.equal(ledgerEntries.length, 1);
    assert.equal(ledgerEntries[0].amountDelta, -1);
  } finally {
    await cleanupFixture(fixture);
  }
});

test("render charges once and retries reuse the same ledger reference", async (t) => {
  if (!(await isEnvironmentReady())) {
    t.skip("Postgres or required migrated tables are unavailable for billing integration tests.");
    return;
  }
  const fixture = await createFixture("render");
  try {
    const item = await createContentItem(fixture.projectId, fixture.strategyCycleId);
    await renderContentItem(item.id, { renderer: "legacy" });
    await renderContentItem(item.id, { renderer: "legacy" });

    const ledgerEntries = await getLedgerEntriesByReference(fixture.userId, "content_item_render", item.id);
    assert.equal(ledgerEntries.length, 1);
    assert.equal(ledgerEntries[0].amountDelta, -1);
  } finally {
    await cleanupFixture(fixture);
  }
});

test("generate-next charges once and retries respect existing ledger reference", async (t) => {
  if (!(await isEnvironmentReady())) {
    t.skip("Postgres or required migrated tables are unavailable for billing integration tests.");
    return;
  }
  const fixture = await createFixture("generate-next");
  try {
    for (let i = 0; i < 5; i += 1) {
      await createContentItem(fixture.projectId, fixture.strategyCycleId);
    }

    const first = await generateNextFromCycle(fixture.strategyCycleId);
    const nextCycleId = first.nextCycle.id;
    assert.ok(first.posts.length > 0);

    const firstLedger = await getLedgerEntriesByReference(fixture.userId, "strategy_cycle_generate_next_pack", nextCycleId);
    assert.equal(firstLedger.length, 1);
    assert.equal(firstLedger[0].amountDelta, -5);

    await db.delete(schema.contentItems).where(eq(schema.contentItems.strategyCycleId, nextCycleId));

    const second = await generateNextFromCycle(fixture.strategyCycleId);
    assert.equal(second.nextCycle.id, nextCycleId);
    assert.ok(second.posts.length > 0);

    const secondLedger = await getLedgerEntriesByReference(fixture.userId, "strategy_cycle_generate_next_pack", nextCycleId);
    assert.equal(secondLedger.length, 1);
  } finally {
    await cleanupFixture(fixture);
  }
});
