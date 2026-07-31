import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { ApiKeyAuthError } from "@/domains/api-keys/service";
import { cancelScheduledContentItem, scheduleContentItem } from "@/domains/publishing/service";
import { db, schema } from "@/lib/db";
import { toErrorResponse } from "@/lib/http/errors";
import { requireApiKeyIdentity, PublicApiAuthRequiredError } from "@/lib/public-api/auth";
import { assertHasScope, assertProjectScope } from "@/lib/public-api/guards";
import { consumeRateLimit, RateLimitExceededError } from "@/lib/public-api/rate-limit";
import { scheduleContentItemBodySchema } from "@/lib/validation/publishing";

async function authorize(request: Request, contentItemId: string) {
  const identity = await requireApiKeyIdentity(request);
  await consumeRateLimit({ apiKeyId: identity.apiKeyId, key: "public_content_schedule", limit: 30, windowSec: 60 });
  const scope = assertHasScope(identity, "content:schedule");
  if (!scope.ok) return scope;

  const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
  if (!item) return { ok: false as const, status: 404 as const, body: { error: "Content item not found.", code: "NOT_FOUND" } };
  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, item.projectId) });
  if (!project || project.userId !== identity.userId) {
    return { ok: false as const, status: 404 as const, body: { error: "Content item not found.", code: "NOT_FOUND" } };
  }
  const projectScope = assertProjectScope(identity, project.id);
  if (!projectScope.ok) return projectScope;
  return { ok: true as const, item };
}

function publicError(error: unknown) {
  if (error instanceof PublicApiAuthRequiredError) return NextResponse.json({ error: error.message, code: "API_KEY_REQUIRED" }, { status: 401 });
  if (error instanceof ApiKeyAuthError) return NextResponse.json({ error: error.message, code: "API_KEY_INVALID" }, { status: 401 });
  if (error instanceof RateLimitExceededError) {
    return NextResponse.json(
      { error: error.message, code: "RATE_LIMIT_EXCEEDED", retryAfterSec: error.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(error.retryAfterSec) } },
    );
  }
  return toErrorResponse(error);
}

export async function GET(request: Request, context: { params: Promise<{ contentItemId: string }> }) {
  try {
    const { contentItemId } = await context.params;
    const authorized = await authorize(request, contentItemId);
    if (!authorized.ok) return NextResponse.json(authorized.body, { status: authorized.status });
    const jobs = await db.query.jobQueue.findMany({
      where: eq(schema.jobQueue.type, "publish_content_item"),
      orderBy: [desc(schema.jobQueue.createdAt)],
    });
    const job = jobs.find((candidate) => (candidate.payloadJson as { contentItemId?: string }).contentItemId === contentItemId) ?? null;
    return NextResponse.json({ item: authorized.item, job });
  } catch (error) {
    return publicError(error);
  }
}

async function schedule(request: Request, context: { params: Promise<{ contentItemId: string }> }) {
  try {
    const { contentItemId } = await context.params;
    const body = scheduleContentItemBodySchema.parse(await request.json());
    const authorized = await authorize(request, contentItemId);
    if (!authorized.ok) return NextResponse.json(authorized.body, { status: authorized.status });
    return NextResponse.json(await scheduleContentItem(contentItemId, new Date(body.scheduledFor)));
  } catch (error) {
    return publicError(error);
  }
}

export const POST = schedule;
export const PATCH = schedule;

export async function DELETE(request: Request, context: { params: Promise<{ contentItemId: string }> }) {
  try {
    const { contentItemId } = await context.params;
    const authorized = await authorize(request, contentItemId);
    if (!authorized.ok) return NextResponse.json(authorized.body, { status: authorized.status });
    return NextResponse.json(await cancelScheduledContentItem(contentItemId));
  } catch (error) {
    return publicError(error);
  }
}
