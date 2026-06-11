import { z } from "zod";

export const promoBriefSourceTypeSchema = z.enum([
  "product_update",
  "changelog",
  "url",
  "manual",
  "demo_clip",
]);

export const promoBriefToneSchema = z.enum([
  "clear",
  "bold",
  "playful",
  "technical",
  "premium",
  "urgent",
]);

export const promoBriefPlatformSchema = z.enum([
  "x",
  "tiktok",
  "youtube_shorts",
  "instagram_reels",
  "linkedin",
]);

export const promoBriefDurationSchema = z.union([
  z.literal(15),
  z.literal(30),
  z.literal(45),
  z.literal(60),
]);

export const promoBriefAspectRatioSchema = z.enum(["9:16", "1:1", "16:9"]);

export const promoBriefSourceSchema = z.object({
  type: promoBriefSourceTypeSchema,
  rawText: z.string().trim().min(1).optional(),
  url: z.string().trim().url().optional(),
  assetIds: z.array(z.string().trim().min(1)).optional(),
});

export const promoBriefProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  oneLine: z.string().trim().min(1, "One-line description is required"),
  targetAudience: z.string().trim().min(1, "Target audience is required"),
  category: z.string().trim().min(1).optional(),
});

export const promoBriefMessageSchema = z.object({
  primaryPromise: z.string().trim().min(1, "Primary promise is required"),
  painPoint: z.string().trim().min(1).optional(),
  featureHighlights: z
    .array(z.string().trim().min(1))
    .min(1, "At least one feature highlight is required"),
  proofPoints: z.array(z.string().trim().min(1)).optional(),
  callToAction: z.string().trim().min(1, "Call to action is required"),
});

export const promoBriefCreativeSchema = z.object({
  tone: promoBriefToneSchema,
  platform: promoBriefPlatformSchema,
  durationSeconds: promoBriefDurationSchema,
  aspectRatio: promoBriefAspectRatioSchema,
});

export const promoBriefConstraintsSchema = z.object({
  mustInclude: z.array(z.string().trim().min(1)).optional(),
  mustAvoid: z.array(z.string().trim().min(1)).optional(),
  brandTerms: z.array(z.string().trim().min(1)).optional(),
});

export const promoBriefSchema = z.object({
  id: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
  source: promoBriefSourceSchema,
  product: promoBriefProductSchema,
  message: promoBriefMessageSchema,
  creative: promoBriefCreativeSchema,
  constraints: promoBriefConstraintsSchema.default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createPromoBriefDraftInputSchema = promoBriefSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PromoBriefSourceType = z.infer<typeof promoBriefSourceTypeSchema>;
export type PromoBriefTone = z.infer<typeof promoBriefToneSchema>;
export type PromoBriefPlatform = z.infer<typeof promoBriefPlatformSchema>;
export type PromoBriefDurationSeconds = z.infer<typeof promoBriefDurationSchema>;
export type PromoBriefAspectRatio = z.infer<typeof promoBriefAspectRatioSchema>;
export type PromoBriefSource = z.infer<typeof promoBriefSourceSchema>;
export type PromoBriefProduct = z.infer<typeof promoBriefProductSchema>;
export type PromoBriefMessage = z.infer<typeof promoBriefMessageSchema>;
export type PromoBriefCreative = z.infer<typeof promoBriefCreativeSchema>;
export type PromoBriefConstraints = z.infer<typeof promoBriefConstraintsSchema>;
export type PromoBrief = z.infer<typeof promoBriefSchema>;
export type CreatePromoBriefDraftInput = z.infer<typeof createPromoBriefDraftInputSchema>;