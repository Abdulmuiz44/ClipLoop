import { z } from "zod";

export const weeklyPromoChannelSchema = z.enum(["instagram", "tiktok", "whatsapp", "x"]);

export const weeklyPromoInputSchema = z.object({
  appName: z.string().trim().min(2).max(100),
  appWebsiteUrl: z.string().trim().url().optional().or(z.literal("")),
  weeklyUpdate: z.string().trim().min(8).max(500),
  targetAudience: z.string().trim().min(1).max(200).optional(),
  callToAction: z.string().trim().min(1).max(200).optional(),
  channel: weeklyPromoChannelSchema,
  tone: z.string().trim().min(2).max(100),
});

export const productContextSchema = z.object({
  productName: z.string(),
  oneLineDescription: z.string(),
  targetUsers: z.array(z.string()).default([]),
  mainBenefits: z.array(z.string()).default([]),
  keyFeatures: z.array(z.string()).default([]),
  ctaLanguage: z.array(z.string()).default([]),
  toneHints: z.array(z.string()).default([]),
});

export const weeklyPromoScriptSchema = z.object({
  hook: z.string(),
  body: z.array(z.string()).min(2).max(5),
  caption: z.string(),
  cta: z.string(),
  sceneOutline: z.array(z.string()).min(3).max(6),
});

export type WeeklyPromoInput = z.infer<typeof weeklyPromoInputSchema>;
export type ProductContext = z.infer<typeof productContextSchema>;
export type WeeklyPromoScript = z.infer<typeof weeklyPromoScriptSchema>;
