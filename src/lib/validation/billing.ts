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
  limits: mePlanResponseSchema.shape.limits,
});
