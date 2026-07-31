import { env } from "@/lib/env";
import type { PublisherAdapter } from "@/lib/publisher/types";

const TELEGRAM_API_BASE = "https://api.telegram.org";
const MAX_MESSAGE_LENGTH = 4096;

type TelegramConfig = { botToken?: string; channelId?: string };
type TelegramResponse = {
  ok: boolean;
  description?: string;
  result?: { message_id?: number };
};

export function isTelegramPublishingConfigured() {
  return Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHANNEL_ID);
}

function validateChannelId(channelId: string | undefined) {
  if (!channelId || !(/^@[A-Za-z0-9_]{5,32}$/.test(channelId) || /^-100\d{5,}$/.test(channelId))) {
    throw new Error("Telegram channel must be a public @username or a numeric -100 channel ID.");
  }
  return channelId;
}

function messageText(contentItem: { caption: string; destinationUrl: string }) {
  const caption = contentItem.caption.trim();
  const destinationUrl = contentItem.destinationUrl.trim();
  if (!caption) throw new Error("Telegram publishing requires non-empty content text.");
  if (!destinationUrl) throw new Error("Telegram publishing requires a destination URL.");

  const text = `${caption}\n\n${destinationUrl}`;
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Telegram message exceeds the ${MAX_MESSAGE_LENGTH}-character limit.`);
  }
  return text;
}

export function createTelegramPublisher(config: TelegramConfig = {}): PublisherAdapter {
  const botToken = config.botToken ?? env.TELEGRAM_BOT_TOKEN;
  const channelId = config.channelId ?? env.TELEGRAM_CHANNEL_ID;

  return {
    async validateContentItemReady(contentItem) {
      if (!botToken) throw new Error("Telegram publishing is not configured. Set TELEGRAM_BOT_TOKEN.");
      validateChannelId(channelId);
      if (!contentItem.approvedAt) throw new Error("Content item must be approved before publishing.");
      if (!contentItem.scheduledFor || contentItem.scheduledFor.getTime() > Date.now()) {
        throw new Error("Content item is not due yet.");
      }
      messageText(contentItem);
    },

    async publishContentItem(contentItem, channel) {
      await this.validateContentItemReady(contentItem, channel);
      const text = messageText(contentItem);
      const response = await fetch(`${TELEGRAM_API_BASE}/bot${encodeURIComponent(botToken!)}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: channelId, text, disable_web_page_preview: false }),
        cache: "no-store",
      });
      const json = (await response.json().catch(() => null)) as TelegramResponse | null;
      if (!response.ok || !json?.ok || !json.result?.message_id) {
        throw new Error(json?.description ?? `Telegram API request failed (${response.status})`);
      }

      const externalPostUrl = channelId!.startsWith("@")
        ? `https://t.me/${channelId!.slice(1)}/${json.result.message_id}`
        : null;
      return {
        externalPostId: String(json.result.message_id),
        externalPostUrl,
        publishedAt: new Date(),
        mode: "telegram" as const,
        metadataJson: { channelId: channelId!, messageId: json.result.message_id },
      };
    },
  };
}

export const telegramPublisher = createTelegramPublisher();
