import type { WeeklyStrategyOutput } from "@/lib/validation/strategy";
import type { GeneratedPost } from "@/lib/validation/content";
import type { z } from "zod";
import type { iterationAnalysisSchema } from "@/lib/validation/iteration";

export type ProjectPromptContext = {
  name: string;
  productName: string;
  oneLiner?: string | null;
  description: string;
  audience: string;
  niche: string;
  offer: string;
  projectType?: "business" | "creator" | "app" | null;
  businessName?: string | null;
  businessCategory?: string | null;
  businessDescription?: string | null;
  city?: string | null;
  state?: string | null;
  targetAudience?: string | null;
  primaryOffer?: string | null;
  priceRange?: string | null;
  tone?: string | null;
  callToAction?: string | null;
  instagramHandle?: string | null;
  whatsappNumber?: string | null;
  websiteUrl?: string | null;
  ctaUrl: string;
  preferredChannels?: string | null;
  languageStyle?: "english" | "pidgin" | "mixed" | null;
  goalType: "clicks" | "signups" | "revenue";
  voiceStyleNotes?: string | null;
  examplePosts: string[];
};

function languageInstruction(languageStyle: ProjectPromptContext["languageStyle"]) {
  if (languageStyle === "pidgin") return "Write in natural Nigerian Pidgin.";
  if (languageStyle === "mixed") return "Blend clear English with light natural Nigerian Pidgin where it feels conversational.";
  return "Write in clear English with local Nigerian business context where relevant.";
}

export function weeklyStrategyPrompt(project: ProjectPromptContext) {
  const primaryAudience = project.targetAudience ?? project.audience;
  const primaryOffer = project.primaryOffer ?? project.offer;
  const profileName = project.businessName ?? project.productName;
  const type = project.projectType ?? "app";
  const location = [project.city, project.state].filter(Boolean).join(", ");

  return [
    "Generate one weekly strategy JSON with exactly 5 angles.",
    "Focus on short-form promo content for local Nigerian businesses and creators.",
    "Bias angles toward offer-led hooks, practical urgency/scarcity when appropriate, social proof style proof points, and clear CTAs.",
    languageInstruction(project.languageStyle),
    `Project type: ${type}`,
    `Profile: ${profileName}`,
    `Category/Niche: ${project.businessCategory ?? project.niche}`,
    `Audience: ${primaryAudience}`,
    `Offer: ${primaryOffer}`,
    `Tone: ${project.tone ?? project.voiceStyleNotes ?? "direct and practical"}`,
    `CTA: ${project.callToAction ?? "Send a message or click to start"}`,
    `Preferred channels: ${project.preferredChannels ?? "instagram,tiktok"}`,
    `Location: ${location || "Nigeria"}`,
    `Goal type: ${project.goalType}`,
    `Website: ${project.websiteUrl ?? "n/a"}`,
    `CTA URL: ${project.ctaUrl}`,
    `Description: ${project.businessDescription ?? project.description}`,
    "Output valid JSON only.",
  ].join("\n");
}

export function postGenerationPrompt(project: ProjectPromptContext, strategy: WeeklyStrategyOutput) {
  const primaryAudience = project.targetAudience ?? project.audience;
  const primaryOffer = project.primaryOffer ?? project.offer;
  const profileName = project.businessName ?? project.productName;
  const cta = project.callToAction ?? "Send us a DM now";

  return [
    "Generate exactly 5 short-form post drafts in JSON.",
    "Posts must feel local, practical, and business-aware for Nigeria.",
    "Rules:",
    "- lead with promo or offer-led hooks",
    "- use urgency or scarcity only when context supports it",
    "- include social proof style angles (results, testimonials, before/after, customer reactions)",
    "- keep slides concise and mobile-friendly",
    `- tone should follow: ${project.tone ?? project.voiceStyleNotes ?? "direct and confident"}`,
    `- language style: ${project.languageStyle ?? "english"} (${languageInstruction(project.languageStyle)})`,
    `- preferred channels: ${project.preferredChannels ?? "instagram,tiktok"}`,
    `- include practical CTA style around: ${cta}`,
    `Business profile: ${profileName}`,
    `Type: ${project.projectType ?? "app"}`,
    `Category: ${project.businessCategory ?? project.niche}`,
    `Audience: ${primaryAudience}`,
    `Offer: ${primaryOffer}`,
    `Price range: ${project.priceRange ?? "not specified"}`,
    `Instagram handle: ${project.instagramHandle ?? "not provided"}`,
    `WhatsApp: ${project.whatsappNumber ?? "not provided"}`,
    `Fallback destination URL: ${project.ctaUrl}`,
    `Strategy JSON: ${JSON.stringify(strategy)}`,
    "Output valid JSON only.",
  ].join("\n");
}

export function regeneratePostPrompt(post: GeneratedPost, reason?: string) {
  return `Regenerate one post with improved clarity. Original post JSON: ${JSON.stringify(post)}. Context: ${reason ?? "general improvement"}`;
}

export function iterationAnalysisPrompt(input: {
  strategyCycleId: string;
  performanceRows: Array<{
    contentItemId: string;
    score: number;
    clicks: number;
    signups: number;
    revenue: number;
    classification: string | null;
  }>;
  contentSummaries: Array<{ contentItemId: string; hook: string; angle: string; ctaText: string }>;
}) {
  return `Analyze weekly performance and produce structured iteration insights.\nCycle: ${input.strategyCycleId}\nPerformance: ${JSON.stringify(input.performanceRows)}\nContent: ${JSON.stringify(input.contentSummaries)}`;
}

export function iterationNextPackPrompt(input: {
  analysis: z.infer<typeof iterationAnalysisSchema>;
  productName: string;
  projectType?: "business" | "creator" | "app" | null;
  audience?: string | null;
  primaryOffer?: string | null;
  tone?: string | null;
  callToAction?: string | null;
  preferredChannels?: string | null;
  languageStyle?: "english" | "pidgin" | "mixed" | null;
}) {
  return [
    `Generate next-week pack improvements for ${input.productName}.`,
    `Type: ${input.projectType ?? "app"}`,
    `Audience: ${input.audience ?? "not specified"}`,
    `Offer: ${input.primaryOffer ?? "not specified"}`,
    `Tone: ${input.tone ?? "direct"}`,
    `CTA style: ${input.callToAction ?? "direct action"}`,
    `Preferred channels: ${input.preferredChannels ?? "instagram,tiktok"}`,
    `Language style: ${input.languageStyle ?? "english"} (${languageInstruction(input.languageStyle)})`,
    "Bias the pack toward short promo, offer-first hooks, local relatability, urgency when relevant, and social proof framing.",
    `Analysis JSON: ${JSON.stringify(input.analysis)}`,
  ].join("\n");
}
