import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import {
  createProjectInputSchema,
  updateProjectSettingsInputSchema,
  type CreateProjectInput,
  type UpdateProjectSettingsInput,
} from "@/lib/validation/projects";
import { assertProjectCreationAllowed } from "@/domains/usage/service";

export async function createProject(userId: string, rawInput: unknown) {
  const input = createProjectInputSchema.parse(rawInput);
  await assertProjectCreationAllowed(userId);

  const [project] = await db
    .insert(schema.projects)
    .values({
      userId,
      name: input.name,
      productName: input.productName,
      oneLiner: input.oneLiner ?? null,
      description: input.description,
      audience: input.audience,
      niche: input.niche,
      offer: input.offer,
      websiteUrl: input.websiteUrl ?? null,
      ctaUrl: input.ctaUrl,
      goalType: input.goalType,
      voicePrefsJson: { style_notes: input.voiceStyleNotes ?? "" },
      examplePostsJson: input.examplePosts,
    })
    .returning();

  return project;
}

export async function getProjectById(projectId: string, userId: string) {
  return db.query.projects.findFirst({
    where: and(eq(schema.projects.id, projectId), eq(schema.projects.userId, userId)),
  });
}

export async function listProjectsForUser(userId: string) {
  return db.query.projects.findMany({
    where: eq(schema.projects.userId, userId),
    orderBy: [desc(schema.projects.createdAt)],
  });
}

export async function updateProjectSettings(projectId: string, userId: string, rawInput: unknown) {
  const input = updateProjectSettingsInputSchema.parse(rawInput);
  const project = await getProjectById(projectId, userId);
  if (!project) throw new Error("Project not found");

  const [updated] = await db
    .update(schema.projects)
    .set({
      name: input.name ?? project.name,
      productName: input.productName ?? project.productName,
      oneLiner: input.oneLiner ?? project.oneLiner,
      description: input.description ?? project.description,
      audience: input.audience ?? project.audience,
      niche: input.niche ?? project.niche,
      offer: input.offer ?? project.offer,
      websiteUrl: input.websiteUrl ?? project.websiteUrl,
      ctaUrl: input.ctaUrl ?? project.ctaUrl,
      voicePrefsJson: input.voiceStyleNotes
        ? { ...((project.voicePrefsJson as Record<string, unknown> | null) ?? {}), style_notes: input.voiceStyleNotes }
        : project.voicePrefsJson,
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.id, project.id))
    .returning();

  return updated;
}

export type { CreateProjectInput, UpdateProjectSettingsInput };
