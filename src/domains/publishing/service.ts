import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getPublisher } from "@/lib/publisher";
import { listContentItemsForStrategyCycle } from "@/domains/content-items/service";
import { bulkScheduleBodySchema } from "@/lib/validation/publishing";
import { assertPublishAllowed, incrementUsageCounter } from "@/domains/usage/service";
import { env } from "@/lib/env";
import { getChannelHealth, getProjectChannel } from "@/domains/channels/service";
import { resolveContentItemTargetChannel } from "@/lib/utils/channels";
import { assertFutureSchedule, JOB_LEASE_MS, retryDelayMs } from "@/domains/publishing/scheduling";

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
  assertFutureSchedule(scheduledFor);
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

  const targetChannel = resolveContentItemTargetChannel(item.targetChannel, item.platform);
  if (item.publishStrategy !== "direct_instagram" || targetChannel !== "instagram") {
    throw new Error(`This item is set to manual export flow. Direct scheduling/publishing is only supported for Instagram direct items.`);
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

export async function cancelScheduledContentItem(contentItemId: string) {
  const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
  if (!item) throw new Error("Content item not found");
  if (item.publishStatus !== "scheduled") throw new Error("Only scheduled content can be cancelled");

  const job = await findPendingPublishJob(contentItemId);
  if (!job) throw new Error("Scheduled job is already being processed");
  const [cancelledJob] = await db
    .delete(schema.jobQueue)
    .where(and(eq(schema.jobQueue.id, job.id), eq(schema.jobQueue.status, "pending")))
    .returning();
  if (!cancelledJob) throw new Error("Scheduled job is already being processed");

  const [updated] = await db
    .update(schema.contentItems)
    .set({ scheduledFor: null, publishStatus: "approved", updatedAt: new Date() })
    .where(eq(schema.contentItems.id, contentItemId))
    .returning();
  return { item: updated, cancelledJobId: cancelledJob.id };
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

  const retryAt = new Date(Date.now() + retryDelayMs(job.attempts));
  const [updated] = await db
    .update(schema.jobQueue)
    .set({
      status: "pending",
      runAt: retryAt,
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

async function processClaimedJob(running: typeof schema.jobQueue.$inferSelect) {
  try {
    const payload = parsePayload(running.payloadJson);
    const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, payload.contentItemId) });
    if (!item) throw new Error("Content item not found for job");
    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, item.projectId) });
    if (!project) throw new Error("Project not found");

    const targetChannel = resolveContentItemTargetChannel(item.targetChannel, item.platform);
    if (item.publishStrategy !== "direct_instagram" || targetChannel !== "instagram") {
      throw new Error(`Item is manual export or non-Instagram channel. Direct publish is blocked.`);
    }

    await db
      .update(schema.contentItems)
      .set({ publishStatus: "publishing", updatedAt: new Date() })
      .where(eq(schema.contentItems.id, item.id));

    const channel = await getProjectChannel(project.id, "instagram");
    const normalizedChannel = channel ?? null;
    const channelHealth = getChannelHealth(normalizedChannel);
    const shouldUseMock = env.MOCK_MODE && (!channel || channelHealth.status !== "active");

    if (!shouldUseMock && channelHealth.status !== "active") {
      throw new Error(`Real publishing blocked: ${channelHealth.reason}`);
    }

    const activeChannel = shouldUseMock ? null : normalizedChannel;
    const publisher = getPublisher(activeChannel);
    await publisher.validateContentItemReady(item, activeChannel);
    const publishResult = await publisher.publishContentItem(item, activeChannel);

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

    const job = await markJobCompleted(running.id);
    return { skipped: false, success: true, job, contentItemId: item.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job failed";

    const job = await db.query.jobQueue.findFirst({ where: eq(schema.jobQueue.id, running.id) });
    if (job) {
      const payload = job.payloadJson as { contentItemId?: string };
      if (payload.contentItemId) {
        await db
          .update(schema.contentItems)
          .set({ publishStatus: "failed", updatedAt: new Date() })
          .where(eq(schema.contentItems.id, payload.contentItemId));
      }
    }

    const failedJob = await markJobFailed(running.id, message);
    return { skipped: false, success: false, job: failedJob, error: message };
  }
}

export async function processJob(jobId: string) {
  const result = await db.execute(sql`
    UPDATE job_queue
    SET status = 'running', attempts = attempts + 1, locked_at = now(), last_error = NULL
    WHERE id = ${jobId}
      AND status = 'pending'
      AND run_at <= now()
    RETURNING *
  `);
  const running = result.rows[0] as typeof schema.jobQueue.$inferSelect | undefined;
  if (!running) return { skipped: true, reason: "Job is not due or already claimed", jobId };
  return processClaimedJob(running);
}

async function claimDueJobs(limit: number) {
  const staleBefore = new Date(Date.now() - JOB_LEASE_MS);
  const result = await db.execute(sql`
    WITH due AS (
      SELECT id
      FROM job_queue
      WHERE type = 'publish_content_item'
        AND ((status = 'pending' AND run_at <= now()) OR (status = 'running' AND locked_at < ${staleBefore}))
      ORDER BY run_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    UPDATE job_queue AS job
    SET status = 'running', attempts = job.attempts + 1, locked_at = now(), last_error = NULL
    FROM due
    WHERE job.id = due.id
    RETURNING job.*
  `);
  return result.rows as Array<typeof schema.jobQueue.$inferSelect>;
}

export async function processDueJobs(limit = 20) {
  const jobs = await claimDueJobs(limit);

  let successes = 0;
  let failures = 0;
  let retriesScheduled = 0;
  let dead = 0;
  const details: Array<Awaited<ReturnType<typeof processJob>>> = [];

  for (const job of jobs) {
    const result = await processClaimedJob(job);
    details.push(result);
    if (!result.skipped && result.success) successes += 1;
    if (!result.skipped && !result.success) {
      failures += 1;
      if (result.job?.status === "pending") retriesScheduled += 1;
      if (result.job?.status === "dead") dead += 1;
    }
  }

  return {
    claimed: jobs.length,
    processed: jobs.length,
    successes,
    failures,
    retriesScheduled,
    dead,
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
