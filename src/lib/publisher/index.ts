import { mockPublisher } from "@/lib/publisher/mock";
import { instagramPublisher } from "@/lib/publisher/instagram";
import type { schema } from "@/lib/db";

export function getPublisher(channel: typeof schema.connectedChannels.$inferSelect | null) {
  if (channel?.platform === "instagram" && channel.isActive) {
    return instagramPublisher;
  }
  return mockPublisher;
}
