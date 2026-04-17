import { z } from "zod";

export const renderTemplateIdSchema = z.enum(["clean_dark", "bold_light", "hf_promo_v1"]);
export type RenderTemplateId = z.infer<typeof renderTemplateIdSchema>;

export type RenderTemplate = {
  id: RenderTemplateId;
  displayName: string;
  slideDurationSec: number;
  width: number;
  height: number;
  fps: number;
  bgColor: string;
  textColor: string;
  fontSize: number;
  footerColor: string;
  boxColor: string;
};

export const renderTemplates: Record<RenderTemplateId, RenderTemplate> = {
  clean_dark: {
    id: "clean_dark",
    displayName: "Clean Dark",
    slideDurationSec: 3.2,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0x0f172a",
    textColor: "white",
    fontSize: 62,
    footerColor: "0x94a3b8",
    boxColor: "black@0.25",
  },
  bold_light: {
    id: "bold_light",
    displayName: "Bold Light",
    slideDurationSec: 3,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0xf8fafc",
    textColor: "0f172a",
    fontSize: 68,
    footerColor: "0x334155",
    boxColor: "white@0.45",
  },
  hf_promo_v1: {
    id: "hf_promo_v1",
    displayName: "HyperFrames Promo V1",
    slideDurationSec: 3.2,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0x0f172a",
    textColor: "white",
    fontSize: 62,
    footerColor: "0x94a3b8",
    boxColor: "black@0.25",
  },
};

export function getRenderTemplate(templateId?: string | null): RenderTemplate {
  if (!templateId) return renderTemplates.clean_dark;
  const parsed = renderTemplateIdSchema.safeParse(templateId);
  if (!parsed.success) return renderTemplates.clean_dark;
  if (parsed.data === "hf_promo_v1") return renderTemplates.clean_dark;
  return renderTemplates[parsed.data];
}
