import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getProjectContextDocuments } from "@/domains/context/service";
import { getLatestProjectMemory } from "@/domains/memory/service";
import type { ProjectMemorySnapshot } from "@/domains/memory/service";

export type AssembleMode = "chat" | "generate" | "strategy" | "debug";

export interface AssembleOptions {
  projectId: string;
  mode: AssembleMode;
  conversationId?: string;
  recentMessageCount?: number;
  currentBrief?: string;
}

export interface WebsiteDocSnippet {
  source: string;
  title: string | null;
  snippet: string;
}

export interface ConversationSnippet {
  role: string;
  content: string;
}

export interface AssembledContext {
  projectMemory: ProjectMemorySnapshot | null;
  liveFields: {
    businessName: string;
    businessCategory: string;
    businessDescription: string;
    targetAudience: string;
    primaryOffer: string;
    tone: string;
    callToAction: string;
    languageStyle: string;
    preferredChannels: string[];
    ctaUrl: string;
    goalType: string;
    websiteUrl: string | null;
  };
  websiteContext: WebsiteDocSnippet[];
  recentConversation: ConversationSnippet[];
  currentBrief: string | null;
}

export async function assembleProjectContext(options: AssembleOptions): Promise<AssembledContext> {
  const project = await db.query.projects.findFirst({
    where: eq(schema.projects.id, options.projectId),
  });

  if (!project) {
    throw new Error(`Project not found: ${options.projectId}`);
  }

  const [snapshot, docs] = await Promise.all([
    getLatestProjectMemory(options.projectId),
    getProjectContextDocuments(options.projectId),
  ]);

  const memorySnapshot = snapshot
    ? (snapshot.snapshotJson as unknown as ProjectMemorySnapshot)
    : null;

  const preferredChannels = (() => {
    try {
      return (project.preferredChannelsJson as string[]) ?? [];
    } catch {
      return (project.preferredChannels?.split(",").filter(Boolean) ?? []);
    }
  })();

  const liveFields = {
    businessName: project.businessName ?? project.productName,
    businessCategory: project.businessCategory ?? project.niche,
    businessDescription: project.businessDescription ?? project.description,
    targetAudience: project.targetAudience ?? project.audience,
    primaryOffer: project.primaryOffer ?? project.offer,
    tone: project.tone ?? "direct, clear, local-friendly",
    callToAction: project.callToAction ?? "Send us a DM now",
    languageStyle: project.languageStyle ?? "english",
    preferredChannels,
    ctaUrl: project.ctaUrl,
    goalType: project.goalType,
    websiteUrl: project.websiteUrl,
  };

  const websiteContext: WebsiteDocSnippet[] = docs.slice(0, 3).map((doc) => ({
    source: doc.sourceUrl,
    title: doc.title,
    snippet: doc.contentText.slice(0, 1200),
  }));

  let recentConversation: ConversationSnippet[] = [];
  if (options.conversationId && (options.mode === "chat" || options.mode === "debug")) {
    const recentMessages = await db.query.conversationMessages.findMany({
      where: and(
        eq(schema.conversationMessages.conversationId, options.conversationId),
        eq(schema.conversationMessages.role, "user"),
      ),
      orderBy: [asc(schema.conversationMessages.createdAt)],
    });

    const count = options.recentMessageCount ?? 5;
    recentConversation = recentMessages.slice(-count).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 500),
    }));
  }

  return {
    projectMemory: memorySnapshot,
    liveFields,
    websiteContext,
    recentConversation,
    currentBrief: options.currentBrief ?? null,
  };
}
