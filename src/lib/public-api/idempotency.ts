import crypto from "node:crypto";

import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export class IdempotencyKeyRequiredError extends Error {
  constructor() {
    super("Idempotency-Key header is required.");
  }
}

export class IdempotencyConflictError extends Error {
  constructor() {
    super("Idempotency-Key already used with a different request payload.");
  }
}

export class IdempotencyInProgressError extends Error {
  constructor() {
    super("Request with this Idempotency-Key is already in progress.");
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

export function computeRequestHash(input: { method: string; path: string; body: unknown }) {
  const base = `${input.method.toUpperCase()} ${input.path}\n${stableStringify(input.body)}`;
  return crypto.createHash("sha256").update(base).digest("hex");
}

export async function beginIdempotentRequest(input: {
  userId: string;
  apiKeyId?: string | null;
  key: string;
  method: string;
  path: string;
  requestHash: string;
  ttlHours?: number;
}) {
  const ttlHours = input.ttlHours ?? 24;
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  const referenceId = `${input.path}:${input.key}`;

  const existing = await db.query.idempotencyKeys.findFirst({
    where: and(eq(schema.idempotencyKeys.userId, input.userId), eq(schema.idempotencyKeys.path, input.path), eq(schema.idempotencyKeys.key, input.key)),
  });

  if (existing) {
    if (existing.requestHash !== input.requestHash) throw new IdempotencyConflictError();
    if (existing.status === "completed" && existing.responseJson) {
      return { kind: "replay" as const, responseStatus: existing.responseStatus ?? 200, responseJson: existing.responseJson };
    }
    if (existing.status === "in_progress") throw new IdempotencyInProgressError();
  }

  const [created] = await db
    .insert(schema.idempotencyKeys)
    .values({
      userId: input.userId,
      apiKeyId: input.apiKeyId ?? null,
      key: input.key,
      requestHash: input.requestHash,
      method: input.method.toUpperCase(),
      path: input.path,
      status: "in_progress",
      referenceType: "idempotency",
      referenceId,
      expiresAt,
      updatedAt: new Date(),
    })
    .returning();

  if (!created) throw new Error("Failed to create idempotency record.");

  return { kind: "new" as const, referenceId };
}

export async function completeIdempotentRequest(input: {
  userId: string;
  path: string;
  key: string;
  responseStatus: number;
  responseJson: unknown;
  status?: "completed" | "failed";
}) {
  const status = input.status ?? "completed";
  await db
    .update(schema.idempotencyKeys)
    .set({
      status,
      responseStatus: input.responseStatus,
      responseJson: input.responseJson as any,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.idempotencyKeys.userId, input.userId), eq(schema.idempotencyKeys.path, input.path), eq(schema.idempotencyKeys.key, input.key)));
}
