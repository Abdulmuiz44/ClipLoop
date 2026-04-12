import type { schema } from "@/lib/db";

export type PublishResult = {
  externalPostId: string;
  externalPostUrl: string;
  publishedAt: Date;
};

export interface PublisherAdapter {
  validateContentItemReady(contentItemId: string): Promise<void>;
  publishContentItem(contentItem: typeof schema.contentItems.$inferSelect): Promise<PublishResult>;
}
