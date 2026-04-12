import type { CreateProjectInput } from "@/lib/validation/projects";
import type { WeeklyStrategyOutput } from "@/lib/validation/strategy";
import type { GeneratedPost } from "@/lib/validation/content";
import type { z } from "zod";
import type { iterationAnalysisSchema } from "@/lib/validation/iteration";

export function weeklyStrategyPrompt(project: CreateProjectInput) {
  return `Generate one weekly strategy JSON for:\nProduct: ${project.productName}\nAudience: ${project.audience}\nNiche: ${project.niche}\nOffer: ${project.offer}`;
}

export function postGenerationPrompt(project: CreateProjectInput, strategy: WeeklyStrategyOutput) {
  return `Generate 5 post drafts from this strategy JSON:\n${JSON.stringify(strategy)}\nfor product ${project.productName}`;
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
}) {
  return `Generate next-week pack improvements for ${input.productName} based on analysis: ${JSON.stringify(input.analysis)}`;
}
