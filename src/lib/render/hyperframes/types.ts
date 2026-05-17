import type { ProjectChannel } from "@/lib/utils/channels";
import type { RenderTemplateId } from "@/lib/render/templates";

export type HyperframesTemplateId = RenderTemplateId;

// Represents a single scene block within the video
export type SceneBlock = {
  type: string; // e.g., "text", "image", "video", "transition"
  purpose: string;
  timing: {
    startMs: number;
    durationMs: number;
  };
  primaryText?: string;
  secondaryText?: string;
  cta?: string;
  assetHints?: string[]; // e.g., "product_shot", "customer_quote"
};

export type HyperframesCompositionInput = {
  contentItemId: string;
  businessName: string;
  hook: string;
  channelCaption: string;
  channelCta: string;
  targetChannel: ProjectChannel;
  logoUrl?: string | null;
  backgroundUrl?: string | null;

  // New fields for creative planning
  stylePreset: string; // e.g., "bold_promo", "luxury_brand"
  templateFamily: string; // e.g., "hook_burst", "offer_drop_template"
  durationSec: number;
  tone: string; // e.g., "enthusiastic", "professional", "calm"
  visualNotes?: string; // High-level visual direction
  scenePlan: SceneBlock[]; // Ordered list of scene blocks
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
