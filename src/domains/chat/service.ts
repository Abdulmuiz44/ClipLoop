import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { getPrimaryProjectForUser, getProjectContextDocuments } from "@/domains/context/service";
import { generateStructuredObject, generateText } from "@/lib/llm";
import { generateWeeklyStrategyForProject } from "@/domains/strategy/service";
import { renderContentItem } from "@/domains/rendering/service";
import { buildTrackingSlug } from "@/lib/utils/slugs";
import {
  defaultPublishStrategyForChannel,
  normalizeProjectChannels,
  pickDeterministicChannel,
  type ProjectChannel,
} from "@/lib/utils/channels";
import { env } from "@/lib/env";
import { assertPostGenerationAllowed, assertRenderAllowed, incrementUsageCounter, UsageLimitError } from "@/domains/usage/service";
import {
  assertCanAffordAction,
  chargeGenerateCopyCredits,
  chargeGenerateVideoCredits,
  getCreditWalletSummary,
  InsufficientCreditsError,
} from "@/domains/credits/service";

const chatPromoOutputSchema = z.object({
  internal_title: z.string().min(6),
  hook: z.string().min(8),
  slides: z.array(z.string().min(2)).min(3).max(6),
  caption: z.string().min(8),
  cta_text: z.string().min(2),
  why: z.string().min(6),
});

function inferTargetChannel(prompt: string, fallbackChannels: ProjectChannel[]) {
  const lower = prompt.toLowerCase();
  if (lower.includes("whatsapp")) return "whatsapp" as const;
  if (lower.includes("tiktok") || lower.includes("tik tok")) return "tiktok" as const;
  if (lower.includes("instagram") || lower.includes("ig ")) return "instagram" as const;
  return pickDeterministicChannel(fallbackChannels, 0);
}

function buildBusinessContext(project: typeof schema.projects.$inferSelect, docs: Array<typeof schema.projectContextDocuments.$inferSelect>) {
  const topDocs = docs.slice(0, 3).map((doc) => ({
    source: doc.sourceUrl,
    title: doc.title,
    snippet: doc.contentText.slice(0, 1200),
  }));

  return {
    businessName: project.businessName ?? project.productName,
    businessCategory: project.businessCategory ?? project.niche,
    businessDescription: project.businessDescription ?? project.description,
    targetAudience: project.targetAudience ?? project.audience,
    primaryOffer: project.primaryOffer ?? project.offer,
    tone: project.tone ?? "direct, clear, local-friendly",
    callToAction: project.callToAction ?? "Send us a DM now",
    languageStyle: project.languageStyle ?? "english",
    preferredChannels: normalizeProjectChannels(project.preferredChannelsJson, project.preferredChannels),
    websiteContext: topDocs,
  };
}

async function generatePromoDraft(input: {
  requestText: string;
  targetChannel: ProjectChannel;
  context: ReturnType<typeof buildBusinessContext>;
}) {
  return generateStructuredObject({
    schema: chatPromoOutputSchema,
    prompt: [
      "You are ClipLoop, a localized promo operator for Nigerian businesses and creators.",
      `Target channel: ${input.targetChannel}.`,
      "Generate one short promo video draft with a strong hook, concise slide script, caption, and CTA.",
      "Style guidance:",
      "- Keep it short-form and offer-led.",
      "- Favor urgency/scarcity when useful.",
      "- Use local-friendly, practical language.",
      "- For WhatsApp use compact direct text.",
      "- For TikTok use fast creator-native hook.",
      "- For Instagram use polished promo framing.",
      "",
      `User request: ${input.requestText}`,
      `Business context JSON: ${JSON.stringify(input.context)}`,
    ].join("\n"),
    mockFactory: () => ({
      internal_title: `${input.context.businessName} promo`,
      hook:
        input.context.languageStyle === "pidgin"
          ? `${input.context.primaryOffer} dey run this weekend`
          : `${input.context.primaryOffer} is live this weekend`,
      slides: [
        `Offer: ${input.context.primaryOffer}`,
        `For: ${input.context.targetAudience}`,
        `Why trust us: ${input.context.businessDescription.slice(0, 80)}`,
        `Action: ${input.context.callToAction}`,
      ],
      caption:
        input.targetChannel === "whatsapp"
          ? `${input.context.primaryOffer}. ${input.context.callToAction}`
          : `${input.context.businessName} for ${input.context.targetAudience}. ${input.context.primaryOffer}. ${input.context.callToAction}`,
      cta_text: input.context.callToAction,
      why: "Offer-led, channel-aware promo draft generated from business context.",
    }),
  });
}

async function createContentItemForChat(input: {
  project: typeof schema.projects.$inferSelect;
  strategyCycleId: string;
  targetChannel: ProjectChannel;
  promo: z.infer<typeof chatPromoOutputSchema>;
}) {
  const publishStrategy = defaultPublishStrategyForChannel(input.targetChannel);
  const [item] = await db
    .insert(schema.contentItems)
    .values({
      projectId: input.project.id,
      strategyCycleId: input.strategyCycleId,
      platform: "instagram",
      targetChannel: input.targetChannel,
      publishStrategy,
      manualPublishStatus: publishStrategy === "manual_export" ? "ready_for_export" : "ready_for_export",
      contentType: "slideshow_video",
      internalTitle: input.promo.internal_title,
      angle: `chat-${input.targetChannel}`,
      hook: input.promo.hook,
      slidesJson: input.promo.slides,
      caption: input.promo.caption,
      channelCaptionsJson: {
        [input.targetChannel]: input.promo.caption,
      },
      hashtagsJson: [],
      ctaText: input.promo.cta_text,
      channelCtaTextJson: {
        [input.targetChannel]: input.promo.cta_text,
      },
      destinationUrl: input.project.ctaUrl,
      trackingSlug: buildTrackingSlug(input.project.productName, `chat-${Date.now()}`),
      templateId: env.HYPERFRAMES_ENABLED ? "hf_promo_v1" : "clean_dark",
      renderStatus: "pending",
      publishStatus: "draft",
    })
    .returning();

  return item;
}

export async function listConversationsForUser(userId: string) {
  return db.query.conversations.findMany({
    where: eq(schema.conversations.userId, userId),
    orderBy: [desc(schema.conversations.updatedAt)],
  });
}

export async function createConversationForUser(userId: string, input?: { projectId?: string; title?: string }) {
  const project = input?.projectId
    ? await db.query.projects.findFirst({ where: and(eq(schema.projects.id, input.projectId), eq(schema.projects.userId, userId)) })
    : await getPrimaryProjectForUser(userId);

  const [conversation] = await db
    .insert(schema.conversations)
    .values({
      userId,
      projectId: project?.id ?? null,
      title: input?.title ?? `Chat ${new Date().toISOString().slice(0, 10)}`,
    })
    .returning();

  return conversation;
}

export async function getConversationThread(userId: string, conversationId: string) {
  const conversation = await db.query.conversations.findFirst({
    where: and(eq(schema.conversations.id, conversationId), eq(schema.conversations.userId, userId)),
  });
  if (!conversation) throw new Error("Conversation not found");

  const messages = await db.query.conversationMessages.findMany({
    where: eq(schema.conversationMessages.conversationId, conversation.id),
    orderBy: [asc(schema.conversationMessages.createdAt)],
  });

  return { conversation, messages };
}

type ChatActionMode = "chat" | "generate_copy" | "generate_video";

function formatChatFailureMessage(error: unknown) {
  if (error instanceof InsufficientCreditsError) {
    return `You are low on ${error.bucket} credits (${error.available} available, ${error.required} needed). Chat is still free. Upgrade to Pro for more credits.`;
  }

  if (error instanceof UsageLimitError) {
    if (error.code.includes("POSTS_")) {
      return `You are out of generation credits for this period (${error.used}/${error.limit}). Chat is still free. Upgrade to Pro for more generation credits.`;
    }
    if (error.code.includes("RENDER_")) {
      return `You are out of render credits for this period (${error.used}/${error.limit}). Upgrade to Pro for more video renders.`;
    }
    if (error.code.includes("PROJECT_")) {
      return `You have reached your project limit (${error.used}/${error.limit}). Upgrade to Pro to add more projects.`;
    }
  }

  const message = error instanceof Error ? error.message : "Generation failed";
  return `I could not complete that action: ${message}`;
}

export async function sendChatMessageAndGenerate(params: {
  userId: string;
  conversationId: string;
  content: string;
  mode?: ChatActionMode;
}) {
  const conversation = await db.query.conversations.findFirst({
    where: and(eq(schema.conversations.id, params.conversationId), eq(schema.conversations.userId, params.userId)),
  });
  if (!conversation) throw new Error("Conversation not found");

  const project =
    (conversation.projectId &&
      (await db.query.projects.findFirst({
        where: and(eq(schema.projects.id, conversation.projectId), eq(schema.projects.userId, params.userId)),
      }))) ||
    (await getPrimaryProjectForUser(params.userId));
  if (!project) throw new Error("Onboarding required: create your business profile first.");

  const [userMessage] = await db
    .insert(schema.conversationMessages)
    .values({
      conversationId: conversation.id,
      role: "user",
      kind: "text",
      content: params.content,
      metadataJson: {},
    })
    .returning();

  const mode: ChatActionMode = params.mode ?? "chat";
  const modeLabel =
    mode === "chat"
      ? "chat"
      : mode === "generate_copy"
        ? "promo copy generation (1 credit)"
        : "promo copy + render (2 credits total)";

  const [statusMessage] = await db
    .insert(schema.conversationMessages)
    .values({
      conversationId: conversation.id,
      role: "assistant",
      kind: "status",
      content:
        mode === "chat"
          ? "Thinking... this message is free."
          : `Working on it. Running ${modeLabel}.`,
      metadataJson: { mode },
    })
    .returning();

  const [job] = await db
    .insert(schema.chatJobs)
    .values({
      conversationId: conversation.id,
      userMessageId: userMessage.id,
      assistantMessageId: statusMessage.id,
      projectId: project.id,
      status: "running",
      requestText: params.content,
      metadataJson: { mode },
    })
    .returning();

  try {
    const docs = await getProjectContextDocuments(project.id);
    const context = buildBusinessContext(project, docs);
    if (mode === "chat") {
      const response = await generateText(
        [
          "You are ClipLoop, a promo video operator assistant.",
          "This is a free conversation response. Do not run generation/render steps.",
          "Use business context to answer clearly and suggest next paid action if appropriate.",
          `Business: ${context.businessName}`,
          `Category: ${context.businessCategory}`,
          `Audience: ${context.targetAudience}`,
          `Offer: ${context.primaryOffer}`,
          `Tone: ${context.tone}`,
          `User message: ${params.content}`,
        ].join("\n"),
        "Here is a quick recommendation from your saved business context.",
      );

      const [assistantText] = await db
        .insert(schema.conversationMessages)
        .values({
          conversationId: conversation.id,
          role: "assistant",
          kind: "text",
          content: response,
          metadataJson: { mode, free: true },
        })
        .returning();

      await db
        .update(schema.chatJobs)
        .set({
          status: "completed",
          metadataJson: { mode, free: true },
          updatedAt: new Date(),
        })
        .where(eq(schema.chatJobs.id, job.id));

      await db
        .update(schema.conversations)
        .set({ updatedAt: new Date(), title: conversation.title === "New chat" ? params.content.slice(0, 70) : conversation.title })
        .where(eq(schema.conversations.id, conversation.id));

      return { userMessage, statusMessage, resultMessage: assistantText };
    }

    await assertPostGenerationAllowed(project.userId, 1);
    if (mode === "generate_video") {
      await assertRenderAllowed(project.userId, 1);
    }
    await assertCanAffordAction(
      project.userId,
      mode === "generate_video"
        ? [
            { bucket: "generation", amount: 1 },
            { bucket: "render", amount: 1 },
          ]
        : [{ bucket: "generation", amount: 1 }],
    );

    const targetChannel = inferTargetChannel(params.content, context.preferredChannels);
    const promo = await generatePromoDraft({ requestText: params.content, targetChannel, context });
    const strategyCycle = await generateWeeklyStrategyForProject(project);
    const contentItem = await createContentItemForChat({
      project,
      strategyCycleId: strategyCycle.id,
      targetChannel,
      promo,
    });

    let rendered: Awaited<ReturnType<typeof renderContentItem>> | null = null;
    if (mode === "generate_video") {
      rendered = await renderContentItem(contentItem.id, {
        targetChannel,
        renderer: env.HYPERFRAMES_ENABLED ? "hyperframes" : "legacy",
      });
    }

    let receiptEntries: Array<typeof schema.creditLedgerEntries.$inferSelect>;
    if (mode === "generate_video") {
      const charged = await chargeGenerateVideoCredits({
        userId: project.userId,
        chatJobId: job.id,
        contentItemId: contentItem.id,
      });
      receiptEntries = [charged.generation, charged.render];
    } else {
      const charged = await chargeGenerateCopyCredits({
        userId: project.userId,
        chatJobId: job.id,
        contentItemId: contentItem.id,
      });
      receiptEntries = [charged];
    }
    const wallet = await getCreditWalletSummary(project.userId);

    await incrementUsageCounter({
      userId: project.userId,
      projectId: project.id,
      period: "week",
      field: "postsGenerated",
      amount: 1,
    });
    await incrementUsageCounter({
      userId: project.userId,
      projectId: project.id,
      period: "month",
      field: "postsGenerated",
      amount: 1,
    });

    const [resultMessage] = await db
      .insert(schema.conversationMessages)
      .values({
        conversationId: conversation.id,
        role: "assistant",
        kind: "result",
        content:
          mode === "generate_video"
            ? `Done. Generated and rendered a ${targetChannel} promo video draft for ${project.businessName ?? project.productName}.`
            : `Done. Generated ${targetChannel} promo copy for ${project.businessName ?? project.productName}.`,
        metadataJson: {
          mode,
          targetChannel,
          caption: contentItem.caption,
          ctaText: contentItem.ctaText,
          contentItemId: contentItem.id,
          videoUrl: rendered?.videoAsset.storageUrl ?? null,
          thumbnailUrl: rendered?.thumbnailAsset.storageUrl ?? null,
          downloadUrl: rendered?.videoAsset.storageUrl ?? null,
          creditsConsumed: mode === "generate_video" ? 2 : 1,
          creditReceipts: receiptEntries.map((entry) => ({
            transactionId: entry.id,
            bucket: entry.bucket,
            amount: Math.abs(entry.amountDelta),
            reason: entry.reason,
            createdAt: entry.createdAt.toISOString(),
          })),
          walletAfter: {
            generation: wallet.generationBalance,
            render: wallet.renderBalance,
            periodKey: wallet.periodKey,
          },
        },
      })
      .returning();

    await db
      .update(schema.chatJobs)
      .set({
        status: "completed",
        targetChannel,
        contentItemId: contentItem.id,
        metadataJson: {
          promoWhy: promo.why,
          mode,
          chargedTransactionIds: receiptEntries.map((entry) => entry.id),
        },
        updatedAt: new Date(),
      })
      .where(eq(schema.chatJobs.id, job.id));

    await db
      .update(schema.conversations)
      .set({ updatedAt: new Date(), title: conversation.title === "New chat" ? params.content.slice(0, 70) : conversation.title })
      .where(eq(schema.conversations.id, conversation.id));

    return { userMessage, statusMessage, resultMessage };
  } catch (error) {
    const message = formatChatFailureMessage(error);

    const [failureMessage] = await db
      .insert(schema.conversationMessages)
      .values({
        conversationId: conversation.id,
        role: "assistant",
        kind: "text",
        content: message,
        metadataJson: { blocked: true },
      })
      .returning();

    await db
      .update(schema.chatJobs)
      .set({
        status: "failed",
        errorText: message,
        updatedAt: new Date(),
      })
      .where(eq(schema.chatJobs.id, job.id));

    return { userMessage, statusMessage, resultMessage: failureMessage };
  }
}
