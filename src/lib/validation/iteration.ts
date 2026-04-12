import { z } from "zod";

export const analysisWinnerSchema = z.object({
  content_item_id: z.string().uuid(),
  reason_it_worked: z.string(),
  pattern: z.string(),
});

export const analysisLoserSchema = z.object({
  content_item_id: z.string().uuid(),
  reason_it_failed: z.string(),
});

export const angleMutationSchema = z.object({
  based_on_content_item_id: z.string().uuid(),
  new_angle: z.string(),
  why: z.string(),
});

export const iterationAnalysisSchema = z.object({
  summary: z.string(),
  winners: z.array(analysisWinnerSchema),
  losers: z.array(analysisLoserSchema),
  improved_hooks: z.array(z.string()),
  angle_mutations: z.array(angleMutationSchema),
  angles_to_stop: z.array(z.string()),
});

export const iterationExperimentSchema = z.object({
  winnerContentItemId: z.string().uuid().nullable(),
  mutationType: z.enum(["hook", "cta", "angle", "structure"]),
  hypothesis: z.string().nullable(),
  inputSummary: z.string().nullable(),
  resultSummary: z.string().nullable(),
  status: z.enum(["draft", "generated", "applied", "archived"]),
});

export const generateNextCycleResponseSchema = z.object({
  nextStrategyCycleId: z.string().uuid(),
  generatedPosts: z.array(z.string().uuid()).length(5),
});
