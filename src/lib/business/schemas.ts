import { z } from "zod";

export const businessProfileSchema = z.object({
  websiteUrl: z.string().url(), businessName: z.string().default(""), industry: z.string().default(""), targetAudience: z.string().default(""), mainOffer: z.string().default(""),
  productsOrServices: z.array(z.string()).default([]), keyBenefits: z.array(z.string()).default([]), painPointsSolved: z.array(z.string()).default([]), brandTone: z.string().default(""),
  contentAngles: z.array(z.string()).default([]), ctaIdeas: z.array(z.string()).default([]), oneLineSummary: z.string().default(""), longSummary: z.string().default(""),
});
export type BusinessProfile = z.infer<typeof businessProfileSchema>;
export const promoPackSchema = z.object({
  campaignTitle: z.string(), positioningAngle: z.string(),
  shortFormVideoIdeas: z.array(z.object({ title: z.string(), hook: z.string(), script: z.string(), caption: z.string(), cta: z.string() })).length(5),
  xPosts: z.array(z.string()).length(5), instagramCaptions: z.array(z.string()).length(5), tiktokCaptions: z.array(z.string()).length(5), adCopyVariants: z.array(z.string()).length(3),
  contentCalendar: z.array(z.object({ day: z.string(), postType: z.string(), idea: z.string(), caption: z.string(), cta: z.string() })).length(7),
});
export type PromoPack = z.infer<typeof promoPackSchema>;
