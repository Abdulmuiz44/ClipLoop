import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { generateStructuredObject } from "@/lib/llm";
import { weeklyStrategyPrompt } from "@/lib/prompts/templates";
import { PROMPT_VERSIONS } from "@/lib/prompts/versions";
import { weeklyStrategyOutputSchema } from "@/lib/validation/strategy";
import { getWeekEnd, getWeekStart } from "@/lib/utils/dates";

export async function getStrategyCycleById(strategyCycleId: string) {
  return db.query.strategyCycles.findFirst({ where: eq(schema.strategyCycles.id, strategyCycleId) });
}

export async function getLatestStrategyCycleForProject(projectId: string) {
  return db.query.strategyCycles.findFirst({
    where: eq(schema.strategyCycles.projectId, projectId),
    orderBy: [desc(schema.strategyCycles.createdAt)],
  });
}

export async function generateWeeklyStrategyForProject(project: typeof schema.projects.$inferSelect) {
  const weekStartDate = getWeekStart(new Date());

  const existing = await db.query.strategyCycles.findFirst({
    where: and(eq(schema.strategyCycles.projectId, project.id), eq(schema.strategyCycles.weekStart, weekStartDate)),
  });

  if (existing) {
    return existing;
  }

  const structured = await generateStructuredObject({
    schema: weeklyStrategyOutputSchema,
    prompt: weeklyStrategyPrompt({
      name: project.name,
      productName: project.productName,
      oneLiner: project.oneLiner,
      description: project.description,
      audience: project.audience,
      niche: project.niche,
      offer: project.offer,
      websiteUrl: project.websiteUrl,
      ctaUrl: project.ctaUrl,
      goalType: project.goalType,
      voiceStyleNotes: (project.voicePrefsJson as { style_notes?: string } | null)?.style_notes,
      examplePosts: (project.examplePostsJson as string[] | null) ?? [],
    }),
    mockFactory: () => ({
      strategy_summary: `Week plan for ${project.productName}: educate, prove value, and drive CTA clicks.`,
      angles: Array.from({ length: 5 }).map((_, idx) => ({
        angle_id: `angle-${idx + 1}`,
        angle_name: `Angle ${idx + 1}: ${project.niche} outcome`,
        target_pain: `Pain point ${idx + 1} for ${project.audience}`,
        core_claim: `${project.productName} helps solve this faster.`,
        why_this_angle_could_convert: "It ties directly to an urgent user pain and concrete gain.",
        hooks: [`Hook ${idx + 1}A`, `Hook ${idx + 1}B`],
        recommended_cta_style: "direct",
        proof_mechanism: "example scenario",
        audience_awareness_level: "problem aware",
      })),
    }),
  });

  const [cycle] = await db
    .insert(schema.strategyCycles)
    .values({
      projectId: project.id,
      weekStart: weekStartDate,
      weekEnd: getWeekEnd(weekStartDate),
      source: "initial",
      strategySummary: structured.strategy_summary,
      anglesJson: structured.angles,
      llmProvider: "mock",
      llmModel: "mock-deterministic",
      promptVersion: PROMPT_VERSIONS.weeklyStrategy,
      status: "ready",
    })
    .returning();

  return cycle;
}
