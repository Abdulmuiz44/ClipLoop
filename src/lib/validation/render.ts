import { z } from "zod";
import { renderTemplateIdSchema } from "@/lib/render/templates";

export const renderContentItemBodySchema = z.object({
  templateId: renderTemplateIdSchema.optional(),
});

export const renderStrategyCycleBodySchema = z.object({
  templateId: renderTemplateIdSchema.optional(),
});

export const contentAssetSchema = z.object({
  id: z.string().uuid(),
  contentItemId: z.string().uuid(),
  assetType: z.enum(["video", "thumbnail"]),
  storageUrl: z.string(),
  storagePath: z.string().nullable(),
  durationSec: z.number().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  metadataJson: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.date(),
});
