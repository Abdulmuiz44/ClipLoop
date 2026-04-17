import type { ProjectChannel } from "@/lib/utils/channels";

export type HyperframesTemplateId = "hf_promo_v1";

export type HyperframesCompositionInput = {
  contentItemId: string;
  businessName: string;
  hook: string;
  channelCaption: string;
  channelCta: string;
  targetChannel: ProjectChannel;
  logoUrl?: string | null;
  backgroundUrl?: string | null;
};

export type HyperframesCompositionPackage = {
  compositionHtmlPath: string;
  metadataPath: string;
  jobDir: string;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  templateId: HyperframesTemplateId;
};
