import { and, eq, sql } from "drizzle-orm";

import { db, schema } from "@/lib/db";

export class RateLimitExceededError extends Error {
  retryAfterSec: number;
  limit: number;
  windowSec: number;

  constructor(input: { retryAfterSec: number; limit: number; windowSec: number }) {
    super("Rate limit exceeded.");
    this.retryAfterSec = input.retryAfterSec;
    this.limit = input.limit;
    this.windowSec = input.windowSec;
  }
}

function floorToWindowStart(now: Date, windowSec: number) {
  const ms = now.getTime();
  const windowMs = windowSec * 1000;
  const floored = Math.floor(ms / windowMs) * windowMs;
  return new Date(floored);
}

export async function consumeRateLimit(input: {
  apiKeyId: string;
  key: string;
  limit: number;
  windowSec: number;
}) {
  const now = new Date();
  const windowStart = floorToWindowStart(now, input.windowSec);
  const windowEndMs = windowStart.getTime() + input.windowSec * 1000;
  const retryAfterSec = Math.max(1, Math.ceil((windowEndMs - now.getTime()) / 1000));

  const [row] = await db
    .insert(schema.rateLimitCounters)
    .values({
      apiKeyId: input.apiKeyId,
      key: input.key,
      windowStart,
      count: 1,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.rateLimitCounters.apiKeyId, schema.rateLimitCounters.key, schema.rateLimitCounters.windowStart],
      set: {
        count: sql`${schema.rateLimitCounters.count} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({ count: schema.rateLimitCounters.count });

  const count = row?.count ?? input.limit + 1;
  if (count > input.limit) {
    throw new RateLimitExceededError({ retryAfterSec, limit: input.limit, windowSec: input.windowSec });
  }

  return { count, retryAfterSec };
}
