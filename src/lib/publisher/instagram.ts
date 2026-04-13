import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { decryptChannelAccessToken } from "@/domains/channels/service";
import type { PublisherAdapter } from "@/lib/publisher/types";

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

type InstagramMediaCreateResponse = {
  id: string;
};

type InstagramMediaPublishResponse = {
  id: string;
};

type InstagramMediaDetailResponse = {
  id: string;
  permalink?: string;
};

async function graphPost<T>(path: string, body: Record<string, string>) {
  const form = new URLSearchParams(body);
  const response = await fetch(`${GRAPH_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as T | { error?: { message?: string } } | null;
  if (!response.ok) {
    const message =
      json && typeof json === "object" && "error" in json && json.error?.message
        ? json.error.message
        : `Instagram API request failed (${response.status})`;
    throw new Error(message);
  }

  return json as T;
}

async function graphGet<T>(path: string) {
  const response = await fetch(`${GRAPH_BASE}${path}`, { cache: "no-store" });
  const json = (await response.json().catch(() => null)) as T | { error?: { message?: string } } | null;
  if (!response.ok) {
    const message =
      json && typeof json === "object" && "error" in json && json.error?.message
        ? json.error.message
        : `Instagram API request failed (${response.status})`;
    throw new Error(message);
  }
  return json as T;
}

export const instagramPublisher: PublisherAdapter = {
  async validateContentItemReady(contentItem, channel) {
    if (!channel || !channel.isActive) {
      throw new Error("No active Instagram channel configured for this project.");
    }
    if (!channel.accountId) {
      throw new Error("Connected Instagram channel is missing account ID.");
    }
    if (channel.tokenExpiresAt && channel.tokenExpiresAt.getTime() <= Date.now()) {
      throw new Error("Connected Instagram channel token is expired. Reconnect the channel.");
    }
    if (!contentItem.approvedAt) {
      throw new Error("Content item must be approved before publishing.");
    }
    if (!contentItem.scheduledFor || contentItem.scheduledFor.getTime() > Date.now()) {
      throw new Error("Content item is not due yet.");
    }
    if (contentItem.renderStatus !== "completed") {
      throw new Error("Content item must be rendered before publishing.");
    }

    const video = await db.query.contentAssets.findFirst({
      where: and(eq(schema.contentAssets.contentItemId, contentItem.id), eq(schema.contentAssets.assetType, "video")),
    });

    if (!video?.storageUrl) {
      throw new Error("Rendered video asset is required before publishing.");
    }
  },

  async publishContentItem(contentItem, channel) {
    await this.validateContentItemReady(contentItem, channel);

    const token = decryptChannelAccessToken(channel!);
    const igUserId = channel!.accountId!;

    const video = await db.query.contentAssets.findFirst({
      where: and(eq(schema.contentAssets.contentItemId, contentItem.id), eq(schema.contentAssets.assetType, "video")),
    });

    if (!video?.storageUrl) {
      throw new Error("Rendered video asset is required before publishing.");
    }

    const media = await graphPost<InstagramMediaCreateResponse>(`/${igUserId}/media`, {
      media_type: "REELS",
      video_url: video.storageUrl,
      caption: contentItem.caption,
      access_token: token,
    });

    const published = await graphPost<InstagramMediaPublishResponse>(`/${igUserId}/media_publish`, {
      creation_id: media.id,
      access_token: token,
    });

    const details = await graphGet<InstagramMediaDetailResponse>(`/${published.id}?fields=id,permalink&access_token=${encodeURIComponent(token)}`);

    return {
      externalPostId: details.id,
      externalPostUrl: details.permalink ?? null,
      publishedAt: new Date(),
      mode: "instagram" as const,
      metadataJson: {
        creationId: media.id,
        publishId: published.id,
      },
    };
  },
};
