import { z } from "zod";

export const scheduleContentItemBodySchema = z.object({
  scheduledFor: z.string().datetime({ offset: true }),
});

export const bulkScheduleBodySchema = z.object({
  startAt: z.string().datetime({ offset: true }),
  spacingHours: z.number().int().min(1).max(168).default(24),
  onlyApproved: z.boolean().default(true),
});

export const runJobsBodySchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
});

export const enqueuePublishPayloadSchema = z.object({
  contentItemId: z.string().uuid(),
});

export const jobResponseSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  status: z.string(),
  runAt: z.date(),
  attempts: z.number(),
  maxAttempts: z.number(),
  lastError: z.string().nullable(),
});
