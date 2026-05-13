import type { RenderTemplateId } from "@/lib/render/templates";
import type { CoreChannel } from "@/core/types/channels";

export type RenderBackend = "legacy" | "hyperframes";

export type RenderAdapterInput = {
  contentItemId: string;
  templateId?: RenderTemplateId;
  targetChannel: CoreChannel;
  hook: string;
  slides: string[];
  caption: string;
  ctaText: string;
  businessName: string;
  logoUrl?: string | null;
  backgroundUrl?: string | null;
  output: {
    runDir: string;
    videoPath: string;
    thumbnailPath: string;
    videoUrl: string;
    thumbnailUrl: string;
  };
};

export type RenderAdapterResult = {
  renderer: RenderBackend;
  templateId: string;
  durationSec: number;
  width: number;
  height: number;
  videoPath: string;
  videoUrl: string;
  thumbnailPath: string;
  thumbnailUrl: string;
  metadataJson?: Record<string, unknown>;
};

export interface RenderAdapter {
  backend: RenderBackend;
  render(input: RenderAdapterInput): Promise<RenderAdapterResult>;
}

