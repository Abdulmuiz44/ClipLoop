import { and, asc, desc, eq, lte, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getPublisher } from "@/lib/publisher";
import { listContentItemsForStrategyCycle } from "@/domains/content-items/service";
import { bulkScheduleBodySchema } from "@/lib/validation/publishing";
import { assertPublishAllowed, incrementUsageCounter } from "@/domains/usage/service";
import { env } from "@/lib/env";
import { getChannelHealth, getProjectChannel } from "@/domains/channels/service";

type PublishJobPayload = { contentItemId: string };

function parsePayload(payload: unknown): PublishJobPayload {
  const value = payload as { contentItemId?: string };
  if (!value?.contentItemId) throw new Error("Invalid job payload");
  return { contentItemId: value.contentItemId };
}

export async function approveContentItem(contentItemId: string) {
  const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
  if (!item) throw new Error("Content item not found");

  const [updated] = await db
    .update(schema.contentItems)
    .set({
      approvedAt: new Date(),
      publishStatus: item.publishStatus === "published" ? "published" : "approved",
      updatedAt: new Date(),
    })
    .where(eq(schema.contentItems.id, contentItemId))
    .returning();

  return updated;
}

export async function approveStrategyCycleContent(strategyCycleId: string) {
  const posts = await listContentItemsForStrategyCycle(strategyCycleId);
  const approved: string[] = [];

  for (const post of posts) {
    const updated = await approveContentItem(post.id);
    approved.push(updated.id);
  }

  return { strategyCycleId, total: posts.length, approvedCount: approved.length, approved };
}

async function findPendingPublishJob(contentItemId: string) {
  const jobs = await db.query.jobQueue.findMany({
    where: and(eq(schema.jobQueue.type, "publish_content_item"), eq(schema.jobQueue.status, "pending")),
    orderBy: [desc(schema.jobQueue.createdAt)],
  });

  return jobs.find((job) => {
    const payload = job.payloadJson as { contentItemId?: string };
    return payload.contentItemId === contentItemId;
  });
}

export async function enqueuePublishJob(contentItemId: string, scheduledFor: Date) {
  const existing = await findPendingPublishJob(contentItemId);

  if (existing) {
    const [updated] = await db
      .update(schema.jobQueue)
      .set({
        runAt: scheduledFor,
        payloadJson: { contentItemId },
        lastError: null,
      })
      .where(eq(schema.jobQueue.id, existing.id))
      .returning();

    return { job: updated, mode: "updated" as const };
  }

  const [created] = await db
    .insert(schema.jobQueue)
    .values({
      type: "publish_content_item",
      payloadJson: { contentItemId },
      status: "pending",
      runAt: scheduledFor,
      attempts: 0,
      maxAttempts: 3,
    })
    .returning();

  return { job: created, mode: "created" as const };
}

export async function scheduleContentItem(contentItemId: string, scheduledFor: Date) {
  const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
  if (!item) throw new Error("Content item not found");
  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, item.projectId) });
  if (!project) throw new Error("Project not found");
  await assertPublishAllowed(project.userId, 1);

  if (!item.approvedAt) {
    throw new Error("Content item must be approved before scheduling");
  }

  if (item.renderStatus !== "completed") {
    throw new Error("Content item must be rendered before scheduling");
  }

  const { job, mode } = await enqueuePublishJob(contentItemId, scheduledFor);

  const [updatedItem] = await db
    .update(schema.contentItems)
    .set({
      scheduledFor,
      publishStatus: "scheduled",
      updatedAt: new Date(),
    })
    .where(eq(schema.contentItems.id, contentItemId))
    .returning();

  return { item: updatedItem, job, mode };
}

export async function bulkScheduleStrategyCycleContent(
  strategyCycleId: string,
  input: { startAt: string; spacingHours: number; onlyApproved?: boolean },
) {
  const parsed = bulkScheduleBodySchema.parse(input);
  const posts = await listContentItemsForStrategyCycle(strategyCycleId);
  const target = parsed.onlyApproved ? posts.filter((post) => !!post.approvedAt) : posts;

  const scheduled: Array<{ contentItemId: string; jobId: string; mode: "created" | "updated" }> = [];
  const errors: Array<{ contentItemId: string; error: string }> = [];

  for (let i = 0; i < target.length; i += 1) {
    const post = target[i];
    const runAt = new Date(new Date(parsed.startAt).getTime() + i * parsed.spacingHours * 60 * 60 * 1000);

    try {
      const result = await scheduleContentItem(post.id, runAt);
      scheduled.push({ contentItemId: post.id, jobId: result.job.id, mode: result.mode });
    } catch (error) {
      errors.push({
        contentItemId: post.id,
        error: error instanceof Error ? error.message : "Failed to schedule",
      });
    }
  }

  return {
    strategyCycleId,
    total: target.length,
    scheduled: scheduled.length,
    failed: errors.length,
    scheduledItems: scheduled,
    errors,
  };
}

export async function markJobRunning(jobId: string) {
  const job = await db.query.jobQueue.findFirst({ where: eq(schema.jobQueue.id, jobId) });
  if (!job || (job.status !== "pending" && job.status !== "failed")) return null;

  const [updated] = await db
    .update(schema.jobQueue)
    .set({
      status: "running",
      attempts: job.attempts + 1,
      lockedAt: new Date(),
      lastError: null,
    })
    .where(eq(schema.jobQueue.id, jobId))
    .returning();

  return updated;
}

export async function markJobCompleted(jobId: string) {
  const [updated] = await db
    .update(schema.jobQueue)
    .set({
      status: "completed",
      completedAt: new Date(),
      lockedAt: null,
      lastError: null,
    })
    .where(eq(schema.jobQueue.id, jobId))
    .returning();

  return updated;
}

export async function markJobFailed(jobId: string, errorMessage: string) {
  const job = await db.query.jobQueue.findFirst({ where: eq(schema.jobQueue.id, jobId) });
  if (!job) throw new Error("Job not found");

  if (job.attempts >= job.maxAttempts) {
    return markJobDead(jobId, errorMessage);
  }

  const [updated] = await db
    .update(schema.jobQueue)
    .set({
      status: "failed",
      lockedAt: null,
      lastError: errorMessage,
    })
    .where(eq(schema.jobQueue.id, jobId))
    .returning();

  return updated;
}

export async function markJobDead(jobId: string, errorMessage: string) {
  const [updated] = await db
    .update(schema.jobQueue)
    .set({
      status: "dead",
      lockedAt: null,
      lastError: errorMessage,
    })
    .where(eq(schema.jobQueue.id, jobId))
    .returning();

  return updated;
}

export async function processJob(jobId: string) {
  const running = await markJobRunning(jobId);
  if (!running) {
    return { skipped: true, reason: "Job is not pending", jobId };
  }

  try {
    const payload = parsePayload(running.payloadJson);
    const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, payload.contentItemId) });
    if (!item) throw new Error("Content item not found for job");
    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, item.projectId) });
    if (!project) throw new Error("Project not found");

    await db
      .update(schema.contentItems)
      .set({ publishStatus: "publishing", updatedAt: new Date() })
      .where(eq(schema.contentItems.id, item.id));

    const channel = await getProjectChannel(project.id, "instagram");
    const channelHealth = getChannelHealth(channel ?? null);
    const shouldUseMock = env.MOCK_MODE && (!channel || channelHealth.status !== "active");

    if (!shouldUseMock && channelHealth.status !== "active") {
      throw new Error(`Real publishing blocked: ${channelHealth.reason}`);
    }

    const publisher = getPublisher(shouldUseMock ? null : channel);
    await publisher.validateContentItemReady(item, shouldUseMock ? null : channel);
    const publishResult = await publisher.publishContentItem(item, shouldUseMock ? null : channel);

    await db
      .update(schema.contentItems)
      .set({
        publishStatus: "published",
        publishedAt: publishResult.publishedAt,
        externalPostId: publishResult.externalPostId,
        externalPostUrl: publishResult.externalPostUrl,
        updatedAt: new Date(),
      })
      .where(eq(schema.contentItems.id, item.id));

    await db
      .update(schema.jobQueue)
      .set({
        payloadJson: {
          ...(running.payloadJson as Record<string, unknown>),
          publishMode: publishResult.mode,
          publishedExternalPostId: publishResult.externalPostId,
        },
      })
      .where(eq(schema.jobQueue.id, running.id));

    await incrementUsageCounter({
      userId: project.userId,
      projectId: project.id,
      period: "month",
      field: "postsPublished",
      amount: 1,
    });

    const job = await markJobCompleted(jobId);
    return { skipped: false, success: true, job, contentItemId: item.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job failed";

    const job = await db.query.jobQueue.findFirst({ where: eq(schema.jobQueue.id, jobId) });
    if (job) {
      const payload = job.payloadJson as { contentItemId?: string };
      if (payload.contentItemId) {
        await db
          .update(schema.contentItems)
          .set({ publishStatus: "failed", updatedAt: new Date() })
          .where(eq(schema.contentItems.id, payload.contentItemId));
      }
    }

    const failedJob = await markJobFailed(jobId, message);
    return { skipped: false, success: false, job: failedJob, error: message };
  }
}

export async function processDueJobs(limit = 20) {
  const jobs = await db.query.jobQueue.findMany({
    where: and(
      lte(schema.jobQueue.runAt, new Date()),
      or(eq(schema.jobQueue.status, "pending"), eq(schema.jobQueue.status, "failed")),
    ),
    orderBy: [asc(schema.jobQueue.runAt)],
    limit,
  });

  let successes = 0;
  let failures = 0;
  const details: Array<Awaited<ReturnType<typeof processJob>>> = [];

  for (const job of jobs) {
    const result = await processJob(job.id);
    details.push(result);
    if (!result.skipped && result.success) successes += 1;
    if (!result.skipped && !result.success) failures += 1;
  }

  return {
    processed: jobs.length,
    successes,
    failures,
    details,
  };
}

export async function getJobsForStrategyCycle(strategyCycleId: string) {
  const posts = await listContentItemsForStrategyCycle(strategyCycleId);
  const ids = new Set(posts.map((post) => post.id));

  const jobs = await db.query.jobQueue.findMany({
    where: eq(schema.jobQueue.type, "publish_content_item"),
    orderBy: [desc(schema.jobQueue.createdAt)],
  });

  return jobs.filter((job) => {
    const payload = job.payloadJson as { contentItemId?: string };
    return payload.contentItemId ? ids.has(payload.contentItemId) : false;
  });
}
