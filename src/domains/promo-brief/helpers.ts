import { randomUUID } from "node:crypto";
import { ZodError } from "zod";

import {
  createPromoBriefDraftInputSchema,
  promoBriefSchema,
  type CreatePromoBriefDraftInput,
  type PromoBrief,
} from "./schema";

export function parsePromoBrief(input: unknown): PromoBrief {
  return promoBriefSchema.parse(input);
}

export function validatePromoBrief(
  input: unknown,
): { success: true; data: PromoBrief } | { success: false; error: ZodError } {
  const result = promoBriefSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function createDraftPromoBrief(input: CreatePromoBriefDraftInput): PromoBrief {
  const draft = createPromoBriefDraftInputSchema.parse(input);
  const now = new Date().toISOString();

  return promoBriefSchema.parse({
    ...draft,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  });
}

export function promoBriefToPlanningContext(brief: PromoBrief): string {
  const lines: string[] = [
    "# Promo Brief",
    "",
    `Product: ${brief.product.name} — ${brief.product.oneLine}`,
    `Audience: ${brief.product.targetAudience}`,
  ];

  if (brief.product.category) {
    lines.push(`Category: ${brief.product.category}`);
  }

  lines.push(
    "",
    `Promise: ${brief.message.primaryPromise}`,
  );

  if (brief.message.painPoint) {
    lines.push(`Pain: ${brief.message.painPoint}`);
  }

  lines.push(
    `Features: ${brief.message.featureHighlights.join("; ")}`,
  );

  if (brief.message.proofPoints?.length) {
    lines.push(`Proof: ${brief.message.proofPoints.join("; ")}`);
  }

  lines.push(
    `CTA: ${brief.message.callToAction}`,
    "",
    `Tone: ${brief.creative.tone}`,
    `Platform: ${brief.creative.platform}`,
    `Duration: ${brief.creative.durationSeconds}s`,
    `Aspect: ${brief.creative.aspectRatio}`,
  );

  if (brief.constraints.mustInclude?.length) {
    lines.push(`Must include: ${brief.constraints.mustInclude.join(", ")}`);
  }

  if (brief.constraints.mustAvoid?.length) {
    lines.push(`Must avoid: ${brief.constraints.mustAvoid.join(", ")}`);
  }

  if (brief.constraints.brandTerms?.length) {
    lines.push(`Brand terms: ${brief.constraints.brandTerms.join(", ")}`);
  }

  if (brief.source.rawText) {
    lines.push("", `Source (${brief.source.type}): ${brief.source.rawText}`);
  } else if (brief.source.url) {
    lines.push("", `Source (${brief.source.type}): ${brief.source.url}`);
  }

  return lines.join("\n");
}