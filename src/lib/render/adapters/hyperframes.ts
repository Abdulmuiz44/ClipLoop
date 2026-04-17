import { env } from "@/lib/env";
import { generateThumbnail } from "@/lib/render/ffmpeg";
import type { RenderAdapter, RenderAdapterResult } from "@/lib/render/adapters/types";
import { assertHyperframesAvailable, renderWithHyperframesCli } from "@/lib/render/hyperframes/cli";
import { buildHyperframesComposition } from "@/lib/render/hyperframes/composition";

export class HyperframesDisabledError extends Error {
  constructor() {
    super("HyperFrames renderer is disabled. Set HYPERFRAMES_ENABLED=true to use this render backend.");
  }
}

export const hyperframesRenderAdapter: RenderAdapter = {
  backend: "hyperframes",
  async render(input) {
    if (!env.HYPERFRAMES_ENABLED) {
      throw new HyperframesDisabledError();
    }

    assertHyperframesAvailable();

    const composition = await buildHyperframesComposition({
      input: {
        contentItemId: input.contentItemId,
        businessName: input.businessName,
        hook: input.hook,
        channelCaption: input.caption,
        channelCta: input.ctaText,
        targetChannel: input.targetChannel,
        logoUrl: input.logoUrl,
        backgroundUrl: input.backgroundUrl,
      },
      runDir: input.output.runDir,
    });

    await renderWithHyperframesCli({
      compositionHtmlPath: composition.compositionHtmlPath,
      outputVideoPath: input.output.videoPath,
      width: composition.width,
      height: composition.height,
      fps: composition.fps,
      durationSec: composition.durationSec,
    });

    await generateThumbnail(input.output.videoPath, input.output.thumbnailPath);

    return {
      renderer: "hyperframes",
      templateId: composition.templateId,
      durationSec: composition.durationSec,
      width: composition.width,
      height: composition.height,
      videoPath: input.output.videoPath,
      videoUrl: input.output.videoUrl,
      thumbnailPath: input.output.thumbnailPath,
      thumbnailUrl: input.output.thumbnailUrl,
      metadataJson: {
        targetChannel: input.targetChannel,
        compositionPath: composition.compositionHtmlPath,
        compositionMetadataPath: composition.metadataPath,
        compositionJobDir: composition.jobDir,
      },
    } satisfies RenderAdapterResult;
  },
};
