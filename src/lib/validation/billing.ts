import { z } from "zod";

export const accessRequestInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120).optional().nullable(),
  productName: z.string().min(2).max(120).optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const usageLimitErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  limit: z.number().int().nonnegative(),
  used: z.number().int().nonnegative(),
});

export const mePlanResponseSchema = z.object({
  plan: z.enum(["free", "starter", "beta"]),
  billingStatus: z.string(),
  betaApproved: z.boolean(),
  inviteOnlyMode: z.boolean(),
  canAccessProduct: z.boolean(),
  betaApprovedAt: z.string().datetime().nullable(),
  subscription: z
    .object({
      status: z.string(),
      stripeSubscriptionId: z.string().nullable(),
      stripePriceId: z.string().nullable(),
      cancelAtPeriodEnd: z.boolean(),
      currentPeriodStart: z.string().datetime().nullable(),
      currentPeriodEnd: z.string().datetime().nullable(),
    })
    .nullable(),
  limits: z.object({
    activeProjects: z.number(),
    postsPerWeek: z.number(),
    postsPerMonth: z.number(),
    manualRegenerationsPerWeek: z.number(),
    rendersPerMonth: z.number(),
    publishesPerMonth: z.number(),
    connectedChannels: z.number(),
  }),
});

export const meUsageResponseSchema = z.object({
  usage: z.object({
    postsPerWeek: z.number(),
    postsPerMonth: z.number(),
    manualRegenerationsPerWeek: z.number(),
    rendersPerMonth: z.number(),
    publishesPerMonth: z.number(),
  }),
  remaining: z.object({
    postsPerWeek: z.number(),
    postsPerMonth: z.number(),
    manualRegenerationsPerWeek: z.number(),
    rendersPerMonth: z.number(),
    publishesPerMonth: z.number(),
  }),
  periods: z.object({
    week: z.object({ start: z.string(), end: z.string() }),
    month: z.object({ start: z.string(), end: z.string() }),
  }),
  limits: mePlanResponseSchema.shape.limits,
});
