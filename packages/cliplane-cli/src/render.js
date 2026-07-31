import { join } from "node:path";
import { ensureWorkspace, cliplanePaths } from "./harness.js";
import { renderStoryboard as renderWithFfmpeg } from "./providers/ffmpeg.js";
import { buildRemotionStoryboard } from "./providers/remotion.js";
import { slugify } from "./utils/text.js";
import { writeJson } from "./utils/fs.js";

export async function renderWorkspace(cwd, storyboard, { renderer = "ffmpeg" } = {}) {
  const paths = await ensureWorkspace(cwd);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${stamp}-${slugify(storyboard.title || "cliplane")}.mp4`;
  const output = join(paths.rendersDir, fileName);
  const manifest = {
    title: storyboard.title,
    renderer,
    output,
    scenes: storyboard.scenes,
    createdAt: new Date().toISOString(),
  };
  await writeJson(join(paths.rendersDir, `${fileName}.json`), manifest);
  if (renderer === "remotion") {
    buildRemotionStoryboard(storyboard);
  }
  await renderWithFfmpeg(storyboard, output);
  return { output, manifest };
}
