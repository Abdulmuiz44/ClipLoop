import { z } from "zod";

export const generatedPostSchema = z.object({
  internal_title: z.string(),
  hook: z.string(),
  slides: z.array(z.string()).min(3),
  caption: z.string(),
  cta_text: z.string(),
  hashtags: z.array(z.string()).default([]),
  why_it_should_work: z.string(),
});

export const postBatchOutputSchema = z.object({
  posts: z.array(generatedPostSchema).length(5),
});

export const singlePostOutputSchema = z.object({
  post: generatedPostSchema,
});

export type GeneratedPost = z.infer<typeof generatedPostSchema>;
