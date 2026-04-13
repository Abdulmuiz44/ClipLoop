import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { PublisherAdapter } from "@/lib/publisher/types";

function deterministicExternalId(contentItemId: string) {
  return `mock-post-${contentItemId.slice(0, 8)}`;
}

export const mockPublisher: PublisherAdapter = {
  async validateContentItemReady(contentItem) {
    if (contentItem.renderStatus !== "completed") throw new Error("Content item must be rendered before publishing");

    const video = await db.query.contentAssets.findFirst({
      where: and(
        eq(schema.contentAssets.contentItemId, contentItem.id),
        eq(schema.contentAssets.assetType, "video"),
      ),
    });

    if (!video) {
      throw new Error("Rendered video asset is required before publishing");
    }
  },

  async publishContentItem(contentItem) {
    await this.validateContentItemReady(contentItem, null);
    const externalPostId = deterministicExternalId(contentItem.id);
    return {
      externalPostId,
      externalPostUrl: `https://cliploop.local/mock/${externalPostId}`,
      publishedAt: new Date(),
      mode: "mock",
      metadataJson: { provider: "mockPublisher" },
    };
  },
};
