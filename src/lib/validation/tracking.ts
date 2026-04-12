import { z } from "zod";

export const conversionIngestSchema = z.object({
  clickId: z.string().optional().nullable(),
  contentItemId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  eventType: z.enum(["signup", "trial_started", "purchase"]),
  externalUserId: z.string().optional().nullable(),
  value: z.number().int().optional().nullable(),
  currency: z.string().min(3).max(10).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  occurredAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export const revenueIngestSchema = z.object({
  clickId: z.string().optional().nullable(),
  contentItemId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  source: z.enum(["stripe", "revenuecat", "manual"]),
  externalEventId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  amount: z.number().int(),
  currency: z.string().min(3).max(10),
  eventName: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  occurredAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export const performanceItemSchema = z.object({
  contentItemId: z.string().uuid(),
  clicks: z.number(),
  signups: z.number(),
  revenue: z.number(),
  score: z.number(),
  classification: z.string().nullable(),
});
