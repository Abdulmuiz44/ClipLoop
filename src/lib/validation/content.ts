import { z } from "zod";

export const outputChannelSchema = z.enum(["instagram", "tiktok", "whatsapp"]);
export const publishStrategySchema = z.enum(["direct_instagram", "manual_export"]);
export const manualPublishStatusSchema = z.enum(["ready_for_export", "exported", "posted"]);
export const channelCopyMapSchema = z.object({
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  whatsapp: z.string().optional(),
});

export const generatedPostSchema = z.object({
  internal_title: z.string(),
  hook: z.string(),
  slides: z.array(z.string()).min(3),
  caption: z.string(),
  channel_captions: channelCopyMapSchema.optional().default({}),
  cta_text: z.string(),
  channel_cta_text: channelCopyMapSchema.optional().default({}),
  hashtags: z.array(z.string()).default([]),
  why_it_should_work: z.string(),
});

export const postBatchOutputSchema = z.object({
  posts: z.array(generatedPostSchema).length(5),
});

export const singlePostOutputSchema = z.object({
  post: generatedPostSchema,
});

export const updateContentItemTargetChannelBodySchema = z.object({
  targetChannel: outputChannelSchema,
});

export const updateContentItemPublishStrategyBodySchema = z.object({
  publishStrategy: publishStrategySchema,
});

export const markContentItemManualPostedBodySchema = z.object({
  posted: z.boolean().default(true),
});

export type GeneratedPost = z.infer<typeof generatedPostSchema>;
