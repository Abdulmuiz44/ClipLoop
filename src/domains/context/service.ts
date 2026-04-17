import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { createProject } from "@/domains/projects/service";
import { crawlWebsiteContext, hashContent } from "@/domains/context/ingestion";
import type { OnboardingInput } from "@/lib/validation/chat";

export async function listProjectsForContext(userId: string) {
  return db.query.projects.findMany({
    where: and(eq(schema.projects.userId, userId), eq(schema.projects.status, "active")),
    orderBy: [desc(schema.projects.updatedAt)],
  });
}

export async function getPrimaryProjectForUser(userId: string) {
  const projects = await listProjectsForContext(userId);
  return projects[0] ?? null;
}

export async function getProjectContextDocuments(projectId: string) {
  return db.query.projectContextDocuments.findMany({
    where: eq(schema.projectContextDocuments.projectId, projectId),
    orderBy: [desc(schema.projectContextDocuments.createdAt)],
  });
}

export async function ingestWebsiteIntoProjectContext(projectId: string, websiteUrl: string) {
  const pages = await crawlWebsiteContext({ websiteUrl, maxPages: 3, maxCharsPerPage: 12000 });

  for (const page of pages) {
    const existing = await db.query.projectContextDocuments.findFirst({
      where: and(
        eq(schema.projectContextDocuments.projectId, projectId),
        eq(schema.projectContextDocuments.sourceUrl, page.url),
      ),
    });

    if (existing) {
      await db
        .update(schema.projectContextDocuments)
        .set({
          title: page.title,
          contentText: page.text,
          contentHash: hashContent(page.text),
          metadataJson: page.metadata,
        })
        .where(eq(schema.projectContextDocuments.id, existing.id));
      continue;
    }

    await db.insert(schema.projectContextDocuments).values({
      projectId,
      sourceUrl: page.url,
      title: page.title,
      contentText: page.text,
      contentHash: hashContent(page.text),
      metadataJson: page.metadata,
    });
  }

  return pages.length;
}

export async function completeOnboarding(userId: string, input: OnboardingInput) {
  const project = await createProject(userId, {
    name: `${input.businessName} workspace`,
    productName: input.businessName,
    oneLiner: input.businessCategory,
    description: input.businessDescription,
    audience: input.targetAudience,
    niche: input.businessCategory,
    offer: input.primaryOffer,
    ctaUrl: input.websiteUrl ?? "https://wa.me/",
    goalType: "clicks",
    voiceStyleNotes: input.tone ?? "",
    examplePosts: [],
    projectType: input.projectType ?? "business",
    businessName: input.businessName,
    businessCategory: input.businessCategory,
    businessDescription: input.businessDescription,
    city: input.city ?? null,
    state: input.state ?? null,
    targetAudience: input.targetAudience,
    primaryOffer: input.primaryOffer,
    priceRange: null,
    tone: input.tone ?? null,
    callToAction: input.callToAction ?? null,
    instagramHandle: input.instagramHandle ?? null,
    whatsappNumber: input.whatsappNumber ?? null,
    websiteUrl: input.websiteUrl ?? null,
    preferredChannels: input.preferredChannels,
    languageStyle: input.languageStyle ?? "english",
  });

  await db
    .update(schema.projects)
    .set({
      contextNotes: input.websiteLabel ?? null,
      contextSettingsJson: { onboarding_completed: true },
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.id, project.id));

  let pagesIngested = 0;
  if (input.websiteUrl) {
    pagesIngested = await ingestWebsiteIntoProjectContext(project.id, input.websiteUrl);
  }

  return { projectId: project.id, pagesIngested };
}
