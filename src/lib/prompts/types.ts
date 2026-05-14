import type { ProjectChannel } from "@/lib/utils/channels"; // Assuming ProjectChannel is defined elsewhere

// Represents a single scene block within the video
export interface SceneBlock {
  type: string; // e.g., "text", "image", "video", "transition"
  purpose: string;
  timing: {
    startMs: number; // Start time in milliseconds
    durationMs: number; // Duration of the scene in milliseconds
  };
  primaryText?: string;
  secondaryText?: string;
  cta?: string; // CTA specific to this scene, if any
  assetHints?: string[]; // e.g., "product_shot", "customer_quote", "abstract_visual"
  // Additional fields could be added here, e.g., for specific visual styles, transitions
}

export interface CreativeBrief {
  concept: string;
  objective: string;
  targetChannel: ProjectChannel;
  stylePreset: string; // e.g., "bold_promo", "luxury_brand"
  recommendedTemplateFamily: string; // e.g., "hook_burst", "offer_drop_template"
  cta: string;
  tone: string; // e.g., "enthusiastic", "professional", "calm"
  durationSec: number;
  sceneOutline?: string; // High-level scene description from LLM
  visualDirectionNotes?: string; // Notes on visual style and pacing
}
