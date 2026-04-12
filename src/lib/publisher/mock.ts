import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { PublisherAdapter } from "@/lib/publisher/types";

function deterministicExternalId(contentItemId: string) {
  return `mock-post-${contentItemId.slice(0, 8)}`;
}

export const mockPublisher: PublisherAdapter = {
  async validateContentItemReady(contentItemId) {
    const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
    if (!item) throw new Error("Content item not found");
    if (item.renderStatus !== "completed") throw new Error("Content item must be rendered before publishing");

    const video = await db.query.contentAssets.findFirst({
      where: and(
        eq(schema.contentAssets.contentItemId, contentItemId),
        eq(schema.contentAssets.assetType, "video"),
      ),
    });

    if (!video) {
      throw new Error("Rendered video asset is required before publishing");
    }
  },

  async publishContentItem(contentItem) {
    await this.validateContentItemReady(contentItem.id);
    const externalPostId = deterministicExternalId(contentItem.id);
    return {
      externalPostId,
      externalPostUrl: `https://cliploop.local/mock/${externalPostId}`,
      publishedAt: new Date(),
    };
  },
};
