import type { RenderTemplateId } from "@/lib/render/templates";
import type { CoreChannel } from "@/core/types/channels";

export type StrategyGenerationRequest = {
  projectId: string;
  userId: string;
};

export type PostGenerationRequest = {
  strategyCycleId: string;
  userId: string;
};

export type ContentPlanningHint = {
  targetChannel?: CoreChannel;
  templateId?: RenderTemplateId;
  tone?: string;
  ctaHint?: string;
};

