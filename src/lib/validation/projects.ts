import { z } from "zod";

export const goalTypeSchema = z.enum(["clicks", "signups", "revenue"]);
export const projectTypeSchema = z.enum(["business", "creator", "app"]);
export const languageStyleSchema = z.enum(["english", "pidgin", "mixed"]);
export const projectChannelSchema = z.enum(["instagram", "tiktok", "whatsapp"]);

export const createProjectInputSchema = z.object({
  name: z.string().min(2),
  productName: z.string().min(2),
  oneLiner: z.string().optional().nullable(),
  description: z.string().min(10),
  audience: z.string().min(2),
  niche: z.string().min(2),
  offer: z.string().min(2),
  projectType: projectTypeSchema.optional().nullable(),
  businessName: z.string().optional().nullable(),
  businessCategory: z.string().optional().nullable(),
  businessDescription: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  targetAudience: z.string().optional().nullable(),
  primaryOffer: z.string().optional().nullable(),
  priceRange: z.string().optional().nullable(),
  tone: z.string().optional().nullable(),
  callToAction: z.string().optional().nullable(),
  instagramHandle: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  ctaUrl: z.string().url(),
  preferredChannels: z.array(projectChannelSchema).optional().default(["instagram"]),
  languageStyle: languageStyleSchema.optional().nullable(),
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
  projectType: projectTypeSchema.optional().nullable(),
  businessName: z.string().optional().nullable(),
  businessCategory: z.string().optional().nullable(),
  businessDescription: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  targetAudience: z.string().optional().nullable(),
  primaryOffer: z.string().optional().nullable(),
  priceRange: z.string().optional().nullable(),
  tone: z.string().optional().nullable(),
  callToAction: z.string().optional().nullable(),
  instagramHandle: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  ctaUrl: z.string().url().optional(),
  preferredChannels: z.array(projectChannelSchema).optional(),
  languageStyle: languageStyleSchema.optional().nullable(),
  goalType: goalTypeSchema.optional(),
  voiceStyleNotes: z.string().optional().nullable(),
  examplePosts: z.array(z.string()).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type UpdateProjectSettingsInput = z.infer<typeof updateProjectSettingsInputSchema>;
