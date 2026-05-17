import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getProjectContextDocuments } from "@/domains/context/service";
import { normalizeProjectChannels } from "@/lib/utils/channels";

const CURRENT_SNAPSHOT_VERSION = 1;

type SnapshotSource = "onboarding" | "settings_update";

export interface ProjectMemorySnapshot {
  version: number;
  generatedAt: string;
  source: SnapshotSource;
  whatThisProjectIsAbout: string;
  howClipLoopShouldCreate: string;
  identity: {
    businessName: string | null;
    businessCategory: string | null;
    projectType: string | null;
    businessDescription: string | null;
    city: string | null;
    state: string | null;
  };
  audience: {
    targetAudience: string | null;
    niche: string;
  };
  offer: {
    primaryOffer: string | null;
    priceRange: string | null;
    callToAction: string | null;
    ctaUrl: string;
    goalType: string;
  };
  voice: {
    tone: string | null;
    languageStyle: string | null;
    styleNotes: string | null;
  };
  channels: {
    preferredChannels: string[];
    instagramHandle: string | null;
    whatsappNumber: string | null;
  };
  website: {
    url: string | null;
    pageCount: number;
    lastIngestedAt: string | null;
    topPageTitles: string[];
  };
}

function buildSnapshotJson(project: typeof schema.projects.$inferSelect, docs: Array<typeof schema.projectContextDocuments.$inferSelect>, source: SnapshotSource): ProjectMemorySnapshot {
  const businessName = project.businessName ?? project.productName;
  const businessCategory = project.businessCategory ?? project.niche;
  const targetAudience = project.targetAudience ?? project.audience;
  const primaryOffer = project.primaryOffer ?? project.offer;
  const preferredChannels = normalizeProjectChannels(project.preferredChannelsJson, project.preferredChannels);
  const tone = project.tone ?? "direct, clear, local-friendly";
  const callToAction = project.callToAction ?? "Send us a DM now";
  const languageStyle = project.languageStyle ?? "english";
  const channelsList = preferredChannels.length > 0 ? preferredChannels.join(", ") : "Instagram";

  const whatThisProjectIsAbout = `${businessName} is a ${businessCategory} that serves ${targetAudience}. They offer ${primaryOffer}. ${project.businessDescription ?? project.description}`;

  const howClipLoopShouldCreate = `Create ${languageStyle} content for ${channelsList}. Use ${tone} tone. Focus on CTA: ${callToAction}. Target audience: ${targetAudience}. Key offering: ${primaryOffer}.`;

  return {
    version: CURRENT_SNAPSHOT_VERSION,
    generatedAt: new Date().toISOString(),
    source,
    whatThisProjectIsAbout,
    howClipLoopShouldCreate,
    identity: {
      businessName: project.businessName,
      businessCategory: project.businessCategory,
      projectType: project.projectType,
      businessDescription: project.businessDescription,
      city: project.city,
      state: project.state,
    },
    audience: {
      targetAudience: project.targetAudience,
      niche: project.niche,
    },
    offer: {
      primaryOffer: project.primaryOffer,
      priceRange: project.priceRange,
      callToAction: project.callToAction,
      ctaUrl: project.ctaUrl,
      goalType: project.goalType,
    },
    voice: {
      tone: project.tone,
      languageStyle: project.languageStyle,
      styleNotes: (project.voicePrefsJson as { style_notes?: string } | null)?.style_notes ?? null,
    },
    channels: {
      preferredChannels,
      instagramHandle: project.instagramHandle,
      whatsappNumber: project.whatsappNumber,
    },
    website: {
      url: project.websiteUrl,
      pageCount: docs.length,
      lastIngestedAt: docs.length > 0 ? docs[0].createdAt.toISOString() : null,
      topPageTitles: docs.slice(0, 5).map((d) => d.title ?? d.sourceUrl),
    },
  };
}

export async function generateProjectMemorySnapshot(
  projectId: string,
  source: SnapshotSource,
): Promise<typeof schema.projectMemorySnapshots.$inferSelect> {
  const project = await db.query.projects.findFirst({
    where: eq(schema.projects.id, projectId),
  });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const docs = await getProjectContextDocuments(projectId);
  const snapshotJson = buildSnapshotJson(project, docs, source);

  const latest = await db.query.projectMemorySnapshots.findFirst({
    where: eq(schema.projectMemorySnapshots.projectId, projectId),
    orderBy: [desc(schema.projectMemorySnapshots.version)],
  });

  const nextVersion = (latest?.version ?? 0) + 1;

  const [row] = await db
    .insert(schema.projectMemorySnapshots)
    .values({
      projectId,
      version: nextVersion,
      snapshotJson,
      source,
    })
    .returning();

  return row;
}

export async function getLatestProjectMemory(
  projectId: string,
): Promise<typeof schema.projectMemorySnapshots.$inferSelect | null> {
  const row = await db.query.projectMemorySnapshots.findFirst({
    where: eq(schema.projectMemorySnapshots.projectId, projectId),
    orderBy: [desc(schema.projectMemorySnapshots.version)],
  });
  return row ?? null;
}

export async function refreshProjectMemory(
  projectId: string,
  source: SnapshotSource,
): Promise<typeof schema.projectMemorySnapshots.$inferSelect> {
  return generateProjectMemorySnapshot(projectId, source);
}
