export const SUPPORTED_PROJECT_CHANNELS = ["instagram", "tiktok", "whatsapp"] as const;
export const SUPPORTED_PUBLISH_STRATEGIES = ["direct_instagram", "manual_export"] as const;
export const SUPPORTED_MANUAL_PUBLISH_STATUSES = ["ready_for_export", "exported", "posted"] as const;

export type ProjectChannel = (typeof SUPPORTED_PROJECT_CHANNELS)[number];
export type PublishStrategy = (typeof SUPPORTED_PUBLISH_STRATEGIES)[number];
export type ManualPublishStatus = (typeof SUPPORTED_MANUAL_PUBLISH_STATUSES)[number];

export function isProjectChannel(value: string): value is ProjectChannel {
  return SUPPORTED_PROJECT_CHANNELS.includes(value as ProjectChannel);
}

export function parseLegacyPreferredChannelsText(text: string | null | undefined): ProjectChannel[] {
  if (!text) return [];
  const normalized = text.toLowerCase();
  const channels: ProjectChannel[] = [];
  if (normalized.includes("instagram")) channels.push("instagram");
  if (normalized.includes("tiktok") || normalized.includes("tik tok")) channels.push("tiktok");
  if (normalized.includes("whatsapp") || normalized.includes("whats app")) channels.push("whatsapp");
  return channels;
}

export function normalizeProjectChannels(input: unknown, legacyText?: string | null): ProjectChannel[] {
  const fromArray = Array.isArray(input)
    ? input
        .map((value) => String(value).toLowerCase().trim())
        .filter((value): value is ProjectChannel => isProjectChannel(value))
    : [];

  const merged = fromArray.length > 0 ? fromArray : parseLegacyPreferredChannelsText(legacyText);
  const unique = Array.from(new Set(merged));
  return unique.length > 0 ? unique : ["instagram"];
}

export function pickDeterministicChannel(channels: ProjectChannel[], index: number): ProjectChannel {
  const safeChannels: ProjectChannel[] = channels.length > 0 ? channels : ["instagram"];
  return safeChannels[index % safeChannels.length];
}

export function resolveContentItemTargetChannel(value: unknown, fallbackPlatform?: string | null): ProjectChannel {
  const normalized = String(value ?? "").toLowerCase().trim();
  if (isProjectChannel(normalized)) return normalized;
  if (fallbackPlatform === "tiktok") return "tiktok";
  return "instagram";
}

export function defaultPublishStrategyForChannel(channel: ProjectChannel): PublishStrategy {
  if (channel === "instagram") return "direct_instagram";
  return "manual_export";
}
