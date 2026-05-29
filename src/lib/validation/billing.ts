import { z } from "zod";

export const accessRequestInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120).optional().nullable(),
  productName: z.string().min(2).max(120).optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const starterCheckoutInputSchema = z.object({
  email: z.string().email().optional().nullable(),
  name: z.string().min(2).max(120).optional().nullable(),
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
      lemonSqueezySubscriptionId: z.string().nullable(),
      lemonSqueezyCustomerId: z.string().nullable(),
      lemonSqueezyVariantId: z.string().nullable(),
      managementUrl: z.string().nullable(),
      updatePaymentMethodUrl: z.string().nullable(),
      providerStatus: z.string().nullable(),
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
  dashboard: z.object({
    credits: z.object({
      generationBalance: z.number(),
      renderBalance: z.number(),
      totalBalance: z.number(),
      periodKey: z.string(),
    }),
    usageEvents: z.array(
      z.object({
        id: z.string(),
        action: z.string(),
        source: z.enum(["web", "public_api"]),
        creditsBucket: z.string().nullable(),
        creditsAmount: z.number().nullable(),
        createdAt: z.string(),
        keyPrefix: z.string().nullable(),
      }),
    ),
    breakdownByAction: z.record(z.number()),
    publicApiUsageCount: z.number(),
    creditsSpentLast7d: z.number(),
    creditsSpentLast30d: z.number(),
    apiKeys: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        keyPrefix: z.string(),
        status: z.enum(["active", "revoked"]),
        scopes: z.array(z.string()),
        createdAt: z.string(),
        lastUsedAt: z.string().nullable(),
      }),
    ),
  }),
});

export const checkoutStartResponseSchema = z.object({
  url: z.string().url(),
});
