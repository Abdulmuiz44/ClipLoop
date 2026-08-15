import { z } from "zod";

export const ideaVideoInputSchema = z.object({
  idea: z.string().trim().min(12).max(800),
  audience: z.string().trim().max(200).optional(),
  tone: z.string().trim().min(2).max(100).default("clear and energetic"),
  durationSec: z.coerce.number().int().min(15).max(60).default(30),
  callToAction: z.string().trim().max(200).optional(),
});

export const ideaVideoPlanSchema = z.object({
  title: z.string().min(1),
  hook: z.string().min(1),
  caption: z.string().min(1),
  cta: z.string().min(1),
  scenes: z.array(z.object({
    purpose: z.string().min(1),
    onScreenText: z.string().min(1),
    narration: z.string().min(1),
    visualPrompt: z.string().min(1),
    motion: z.string().min(1),
  })).min(6).max(12),
});

export type IdeaVideoInput = z.infer<typeof ideaVideoInputSchema>;
export type IdeaVideoPlan = z.infer<typeof ideaVideoPlanSchema>;
