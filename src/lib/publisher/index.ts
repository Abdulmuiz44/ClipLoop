import { mockPublisher } from "@/lib/publisher/mock";
import { instagramPublisher } from "@/lib/publisher/instagram";
import { telegramPublisher } from "@/lib/publisher/telegram";
import type { schema } from "@/lib/db";

export function getPublisher(channel: typeof schema.connectedChannels.$inferSelect | null, platform?: "instagram" | "telegram") {
  if (platform === "telegram") return telegramPublisher;
  if (channel?.platform === "instagram" && channel.isActive) {
    return instagramPublisher;
  }
  return mockPublisher;
}
