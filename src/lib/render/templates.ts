import { z } from "zod";

export const renderTemplateIdSchema = z.enum([
  "clean_dark",
  "bold_light",
  "hf_promo_v1", // Existing HyperFrames template, now has distinct properties
  // New Style Presets
  "bold_promo",
  "luxury_brand",
  "creator_ugc",
  "saas_launch",
  "offer_drop",
  "testimonial_punch",
  "product_spotlight",
  // New Template Family IDs (initially mapped to styles)
  "hook_burst", // Will use a fast-paced style
  "offer_drop_template", // Will use the offer_drop style
  "ugc_story", // Will use the creator_ugc style
  "product_showcase", // Will use the product_spotlight style
  "feature_explainer", // Will use the saas_launch style
  "testimonial_ad", // Will use the testimonial_punch style
]);
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
    textColor: "0x0f172a",
    fontSize: 68,
    footerColor: "0x334155",
    boxColor: "white@0.45",
  },
  // Style Presets
  bold_promo: {
    id: "bold_promo",
    displayName: "Bold Promo",
    slideDurationSec: 2.5,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0xEE4B2B", // Crimson Red
    textColor: "white",
    fontSize: 72,
    footerColor: "0x0f172a",
    boxColor: "white@0.2",
  },
  luxury_brand: {
    id: "luxury_brand",
    displayName: "Luxury Brand",
    slideDurationSec: 4.0,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0x1a1a1a", // Dark Grey
    textColor: "gold",
    fontSize: 58,
    footerColor: "0xd4af37", // Gold
    boxColor: "white@0.1",
  },
  creator_ugc: {
    id: "creator_ugc",
    displayName: "Creator UGC",
    slideDurationSec: 3.0,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0xffffff", // White
    textColor: "0x333333", // Dark Grey
    fontSize: 60,
    footerColor: "0x666666", // Medium Grey
    boxColor: "black@0.1",
  },
  saas_launch: {
    id: "saas_launch",
    displayName: "SaaS Launch",
    slideDurationSec: 3.0,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0x007bff", // Primary Blue
    textColor: "white",
    fontSize: 64,
    footerColor: "0x0056b3", // Darker Blue
    boxColor: "white@0.2",
  },
  offer_drop: {
    id: "offer_drop",
    displayName: "Offer Drop",
    slideDurationSec: 2.8,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0x28a745", // Green
    textColor: "white",
    fontSize: 70,
    footerColor: "0x1e7e34", // Darker Green
    boxColor: "white@0.2",
  },
  testimonial_punch: {
    id: "testimonial_punch",
    displayName: "Testimonial Punch",
    slideDurationSec: 3.5,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0xffc107", // Yellow
    textColor: "0x333333", // Dark Grey
    fontSize: 62,
    footerColor: "0xcc9a00", // Darker Yellow
    boxColor: "black@0.1",
  },
  product_spotlight: {
    id: "product_spotlight",
    displayName: "Product Spotlight",
    slideDurationSec: 3.5,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0x6f42c1", // Purple
    textColor: "white",
    fontSize: 66,
    footerColor: "0x5a349a", // Darker Purple
    boxColor: "white@0.2",
  },
  // Template Family Mappings (initially to styles)
  hook_burst: {
    id: "hook_burst",
    displayName: "Hook Burst",
    slideDurationSec: 2.0, // Faster pacing
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0x0f172a", // Default dark background, can be overridden by style
    textColor: "white",
    fontSize: 68, // Slightly larger font
    footerColor: "0x94a3b8",
    boxColor: "black@0.25",
  },
  offer_drop_template: { // Specifically for offer drop template family
    id: "offer_drop_template",
    displayName: "Offer Drop Template",
    // Inherits properties from the 'offer_drop' style preset
    slideDurationSec: 2.8,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0x28a745", // Green
    textColor: "white",
    fontSize: 70,
    footerColor: "0x1e7e34", // Darker Green
    boxColor: "white@0.2",
  },
  ugc_story: {
    id: "ugc_story",
    displayName: "UGC Story",
    // Mapped to creator_ugc style
    slideDurationSec: 3.0,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0xffffff", // White
    textColor: "0x333333", // Dark Grey
    fontSize: 60,
    footerColor: "0x666666", // Medium Grey
    boxColor: "black@0.1",
  },
  product_showcase: {
    id: "product_showcase",
    displayName: "Product Showcase",
    // Mapped to product_spotlight style
    slideDurationSec: 3.5,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0x6f42c1", // Purple
    textColor: "white",
    fontSize: 66,
    footerColor: "0x5a349a", // Darker Purple
    boxColor: "white@0.2",
  },
  feature_explainer: {
    id: "feature_explainer",
    displayName: "Feature Explainer",
    // Mapped to saas_launch style
    slideDurationSec: 3.0,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0x007bff", // Primary Blue
    textColor: "white",
    fontSize: 64,
    footerColor: "0x0056b3", // Darker Blue
    boxColor: "white@0.2",
  },
  testimonial_ad: {
    id: "testimonial_ad",
    displayName: "Testimonial Ad",
    // Mapped to testimonial_punch style
    slideDurationSec: 3.5,
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0xffc107", // Yellow
    textColor: "0x333333", // Dark Grey
    fontSize: 62,
    footerColor: "0xcc9a00", // Darker Yellow
    boxColor: "black@0.1",
  },
  // Existing HyperFrames template, now with distinct properties defined
  hf_promo_v1: {
    id: "hf_promo_v1",
    displayName: "HyperFrames Promo V1",
    slideDurationSec: 3.2, // Default duration for this specific template
    width: 1080,
    height: 1920,
    fps: 30,
    bgColor: "0x0f172a", // Default dark background for HyperFrames
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

  // Map template family IDs to their corresponding style presets
  // If a template family has unique properties beyond style, this logic would need to be extended.
  switch (parsed.data) {
    case "hf_promo_v1": // Ensure HyperFrames template uses its defined properties
      return renderTemplates.hf_promo_v1;
    case "hook_burst":
      return renderTemplates.hook_burst;
    case "offer_drop_template":
      return renderTemplates.offer_drop; // Uses the 'offer_drop' style
    case "ugc_story":
      return renderTemplates.creator_ugc; // Uses the 'creator_ugc' style
    case "product_showcase":
      return renderTemplates.product_spotlight; // Uses the 'product_spotlight' style
    case "feature_explainer":
      return renderTemplates.saas_launch; // Uses the 'saas_launch' style
    case "testimonial_ad":
      return renderTemplates.testimonial_punch; // Uses the 'testimonial_punch' style
    default:
      // For all other defined template IDs (including original styles and new style presets),
      // return the corresponding template object.
      return renderTemplates[parsed.data];
  }
}
