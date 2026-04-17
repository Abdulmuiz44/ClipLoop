import { z } from "zod";
import { projectChannelSchema, projectTypeSchema, languageStyleSchema } from "@/lib/validation/projects";

export const onboardingInputSchema = z.object({
  websiteUrl: z.string().url().optional().nullable(),
  businessName: z.string().min(2),
  businessCategory: z.string().min(2),
  businessDescription: z.string().min(10),
  targetAudience: z.string().min(2),
  primaryOffer: z.string().min(2),
  tone: z.string().optional().nullable(),
  preferredChannels: z.array(projectChannelSchema).min(1).default(["instagram"]),
  instagramHandle: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  callToAction: z.string().optional().nullable(),
  projectType: projectTypeSchema.optional().nullable(),
  languageStyle: languageStyleSchema.optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  websiteLabel: z.string().optional().nullable(),
});

export const createConversationSchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().min(2).max(120).optional(),
});

export const chatMessageCreateSchema = z.object({
  content: z.string().min(2).max(4000),
  mode: z.enum(["chat", "generate_copy", "generate_video"]).default("chat"),
});

export type OnboardingInput = z.infer<typeof onboardingInputSchema>;
