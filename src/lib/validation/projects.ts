import { z } from "zod";

export const goalTypeSchema = z.enum(["clicks", "signups", "revenue"]);

export const createProjectInputSchema = z.object({
  name: z.string().min(2),
  productName: z.string().min(2),
  oneLiner: z.string().optional().nullable(),
  description: z.string().min(10),
  audience: z.string().min(2),
  niche: z.string().min(2),
  offer: z.string().min(2),
  websiteUrl: z.string().url().optional().nullable(),
  ctaUrl: z.string().url(),
  goalType: goalTypeSchema,
  voiceStyleNotes: z.string().optional().nullable(),
  examplePosts: z.array(z.string()).optional().default([]),
});

export const updateProjectSettingsInputSchema = z.object({
  name: z.string().min(2).optional(),
  productName: z.string().min(2).optional(),
  oneLiner: z.string().optional().nullable(),
  description: z.string().min(10).optional(),
  audience: z.string().min(2).optional(),
  niche: z.string().min(2).optional(),
  offer: z.string().min(2).optional(),
  websiteUrl: z.string().url().optional().nullable(),
  ctaUrl: z.string().url().optional(),
  goalType: goalTypeSchema.optional(),
  voiceStyleNotes: z.string().optional().nullable(),
  examplePosts: z.array(z.string()).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type UpdateProjectSettingsInput = z.infer<typeof updateProjectSettingsInputSchema>;
