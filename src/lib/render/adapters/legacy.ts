import { assertFfmpegAvailable, generateThumbnail, renderSlidesToVideo } from "@/lib/render/ffmpeg";
import { getRenderTemplate } from "@/lib/render/templates";
import type { RenderAdapter, RenderAdapterResult } from "@/lib/render/adapters/types";

export const legacyRenderAdapter: RenderAdapter = {
  backend: "legacy",
  async render(input) {
    assertFfmpegAvailable();

    const template = getRenderTemplate(input.templateId ?? "clean_dark");
    await renderSlidesToVideo({
      slides: input.slides,
      footerText: `${template.displayName} • ${input.ctaText}`,
      template,
      workDir: input.output.runDir,
      outputVideoPath: input.output.videoPath,
    });
    await generateThumbnail(input.output.videoPath, input.output.thumbnailPath);

    return {
      renderer: "legacy",
      templateId: template.id,
      durationSec: Math.round(input.slides.length * template.slideDurationSec),
      width: template.width,
      height: template.height,
      videoPath: input.output.videoPath,
      videoUrl: input.output.videoUrl,
      thumbnailPath: input.output.thumbnailPath,
      thumbnailUrl: input.output.thumbnailUrl,
      metadataJson: { slideCount: input.slides.length, targetChannel: input.targetChannel },
    } satisfies RenderAdapterResult;
  },
};
