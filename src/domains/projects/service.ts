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
      projectType: input.projectType ?? null,
      businessName: input.businessName ?? null,
      businessCategory: input.businessCategory ?? null,
      businessDescription: input.businessDescription ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      targetAudience: input.targetAudience ?? null,
      primaryOffer: input.primaryOffer ?? null,
      priceRange: input.priceRange ?? null,
      tone: input.tone ?? null,
      callToAction: input.callToAction ?? null,
      instagramHandle: input.instagramHandle ?? null,
      whatsappNumber: input.whatsappNumber ?? null,
      preferredChannels: input.preferredChannels ?? null,
      languageStyle: input.languageStyle ?? null,
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
      projectType: input.projectType !== undefined ? input.projectType : project.projectType,
      businessName: input.businessName !== undefined ? input.businessName : project.businessName,
      businessCategory: input.businessCategory !== undefined ? input.businessCategory : project.businessCategory,
      businessDescription: input.businessDescription !== undefined ? input.businessDescription : project.businessDescription,
      city: input.city !== undefined ? input.city : project.city,
      state: input.state !== undefined ? input.state : project.state,
      targetAudience: input.targetAudience !== undefined ? input.targetAudience : project.targetAudience,
      primaryOffer: input.primaryOffer !== undefined ? input.primaryOffer : project.primaryOffer,
      priceRange: input.priceRange !== undefined ? input.priceRange : project.priceRange,
      tone: input.tone !== undefined ? input.tone : project.tone,
      callToAction: input.callToAction !== undefined ? input.callToAction : project.callToAction,
      instagramHandle: input.instagramHandle !== undefined ? input.instagramHandle : project.instagramHandle,
      whatsappNumber: input.whatsappNumber !== undefined ? input.whatsappNumber : project.whatsappNumber,
      preferredChannels: input.preferredChannels !== undefined ? input.preferredChannels : project.preferredChannels,
      languageStyle: input.languageStyle !== undefined ? input.languageStyle : project.languageStyle,
      websiteUrl: input.websiteUrl ?? project.websiteUrl,
      ctaUrl: input.ctaUrl ?? project.ctaUrl,
      goalType: input.goalType ?? project.goalType,
      voicePrefsJson:
        input.voiceStyleNotes !== undefined
          ? {
              ...((project.voicePrefsJson as Record<string, unknown> | null) ?? {}),
              style_notes: input.voiceStyleNotes ?? "",
            }
          : project.voicePrefsJson,
      examplePostsJson: input.examplePosts ?? project.examplePostsJson,
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.id, project.id))
    .returning();

  return updated;
}

export type { CreateProjectInput, UpdateProjectSettingsInput };
