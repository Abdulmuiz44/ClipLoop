import type { schema } from "@/lib/db";

export type PublishResult = {
  externalPostId: string;
  externalPostUrl?: string | null;
  publishedAt: Date;
  mode: "mock" | "instagram";
  metadataJson?: Record<string, unknown> | null;
};

export interface PublisherAdapter {
  validateContentItemReady(
    contentItem: typeof schema.contentItems.$inferSelect,
    channel: typeof schema.connectedChannels.$inferSelect | null,
  ): Promise<void>;
  publishContentItem(
    contentItem: typeof schema.contentItems.$inferSelect,
    channel: typeof schema.connectedChannels.$inferSelect | null,
  ): Promise<PublishResult>;
}
