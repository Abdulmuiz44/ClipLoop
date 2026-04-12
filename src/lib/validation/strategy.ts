import { z } from "zod";

export const strategyAngleSchema = z.object({
  angle_id: z.string(),
  angle_name: z.string(),
  target_pain: z.string(),
  core_claim: z.string(),
  why_this_angle_could_convert: z.string(),
  hooks: z.array(z.string()).min(1),
  recommended_cta_style: z.string(),
  proof_mechanism: z.string(),
  audience_awareness_level: z.string(),
});

export const weeklyStrategyOutputSchema = z.object({
  strategy_summary: z.string(),
  angles: z.array(strategyAngleSchema).length(5),
});

export type WeeklyStrategyOutput = z.infer<typeof weeklyStrategyOutputSchema>;
