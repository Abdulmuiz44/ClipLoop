import { createHash, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { conversionIngestSchema, revenueIngestSchema } from "@/lib/validation/tracking";

function hashIp(ip?: string | null) {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex");
}

export function buildTrackedDestinationUrl(input: {
  destinationUrl: string;
  trackingSlug: string;
  contentItemId: string;
  clickId: string;
}) {
  const url = new URL(input.destinationUrl);
  url.searchParams.set("utm_source", "cliploop");
  url.searchParams.set("utm_medium", "short_form");
  url.searchParams.set("utm_campaign", input.trackingSlug);
  url.searchParams.set("clp_post", input.contentItemId);
  url.searchParams.set("clp_click", input.clickId);
  return url.toString();
}

export async function logTrackedClick(input: {
  trackingSlug: string;
  referrer?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  countryCode?: string | null;
}) {
  const contentItem = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.trackingSlug, input.trackingSlug) });
  if (!contentItem) throw new Error("Tracking slug not found");

  const clickId = randomUUID();

  await db.insert(schema.clickEvents).values({
    projectId: contentItem.projectId,
    contentItemId: contentItem.id,
    trackingSlug: contentItem.trackingSlug,
    clickId,
    referrer: input.referrer ?? null,
    utmSource: "cliploop",
    utmMedium: "short_form",
    utmCampaign: contentItem.trackingSlug,
    ipHash: hashIp(input.ip),
    userAgent: input.userAgent ?? null,
    countryCode: input.countryCode ?? null,
  });

  return {
    clickId,
    contentItem,
    redirectUrl: buildTrackedDestinationUrl({
      destinationUrl: contentItem.destinationUrl,
      trackingSlug: contentItem.trackingSlug,
      contentItemId: contentItem.id,
      clickId,
    }),
  };
}

type AttributionResult = {
  projectId: string;
  contentItemId: string | null;
  clickId: string | null;
};

async function resolveAttribution(input: {
  clickId?: string | null;
  contentItemId?: string | null;
  projectId?: string | null;
}): Promise<AttributionResult> {
  if (input.clickId) {
    const click = await db.query.clickEvents.findFirst({ where: eq(schema.clickEvents.clickId, input.clickId) });
    if (click) {
      return {
        projectId: click.projectId,
        contentItemId: click.contentItemId,
        clickId: click.clickId,
      };
    }
  }

  if (input.contentItemId) {
    const contentItem = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, input.contentItemId) });
    if (contentItem) {
      return {
        projectId: contentItem.projectId,
        contentItemId: contentItem.id,
        clickId: input.clickId ?? null,
      };
    }
  }

  if (input.projectId) {
    return {
      projectId: input.projectId,
      contentItemId: input.contentItemId ?? null,
      clickId: input.clickId ?? null,
    };
  }

  throw new Error("Attribution failed: provide clickId, contentItemId, or projectId");
}

export async function ingestConversion(rawInput: unknown) {
  const input = conversionIngestSchema.parse(rawInput);
  const attribution = await resolveAttribution(input);

  const [event] = await db
    .insert(schema.conversionEvents)
    .values({
      projectId: attribution.projectId,
      contentItemId: attribution.contentItemId,
      clickId: attribution.clickId,
      eventType: input.eventType,
      externalUserId: input.externalUserId ?? null,
      value: input.value ?? null,
      currency: input.currency ?? null,
      metadataJson: input.metadata ?? null,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
    })
    .returning();

  return event;
}

export async function ingestRevenue(rawInput: unknown) {
  const input = revenueIngestSchema.parse(rawInput);
  const attribution = await resolveAttribution(input);

  if (input.externalEventId) {
    const existing = await db.query.revenueEvents.findFirst({
      where: and(eq(schema.revenueEvents.source, input.source), eq(schema.revenueEvents.externalEventId, input.externalEventId)),
    });
    if (existing) {
      return existing;
    }
  }

  const [event] = await db
    .insert(schema.revenueEvents)
    .values({
      projectId: attribution.projectId,
      contentItemId: attribution.contentItemId,
      clickId: attribution.clickId,
      source: input.source,
      externalEventId: input.externalEventId ?? null,
      customerId: input.customerId ?? null,
      amount: input.amount,
      currency: input.currency,
      eventName: input.eventName ?? null,
      metadataJson: input.metadata ?? null,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
    })
    .returning();

  return event;
}
