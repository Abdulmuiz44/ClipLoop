import { promises as fs } from "node:fs";
import path from "node:path";

export function getContentItemOutputDir(contentItemId: string) {
  return path.join(process.cwd(), "public", "generated", "content-items", contentItemId);
}

export async function prepareRenderOutput(contentItemId: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const root = getContentItemOutputDir(contentItemId);
  const runDir = path.join(root, timestamp);
  await fs.mkdir(runDir, { recursive: true });

  return {
    runDir,
    videoFileName: "rendered.mp4",
    thumbnailFileName: "thumbnail.jpg",
    videoPath: path.join(runDir, "rendered.mp4"),
    thumbnailPath: path.join(runDir, "thumbnail.jpg"),
    videoUrl: `/generated/content-items/${contentItemId}/${timestamp}/rendered.mp4`,
    thumbnailUrl: `/generated/content-items/${contentItemId}/${timestamp}/thumbnail.jpg`,
  };
}
