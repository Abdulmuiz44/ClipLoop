import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { wrapLines } from "../utils/text.js";

function ffmpegRun(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stderr });
      else reject(new Error(`ffmpeg exited with code ${code}\n${stderr}`));
    });
  });
}

function fontPath() {
  const candidates = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
  ];
  return candidates.find((item) => existsSync(item)) || "";
}

async function renderScene(scene, index, workdir, font) {
  const duration = scene.duration ?? 10;
  const textFile = join(workdir, `scene-${index}.txt`);
  const output = join(workdir, `scene-${index}.mp4`);
  const lines = [];
  if (scene.type === "title") {
    lines.push("CLIPLOOP");
    lines.push("");
    lines.push(wrapLines(scene.caption || "Launch your update", 28));
  } else if (scene.type === "terminal") {
    lines.push("COMMAND");
    lines.push("");
    lines.push(wrapLines(scene.command || "cliploop init", 36));
    lines.push("");
    lines.push(wrapLines(scene.caption || "", 32));
  } else if (scene.type === "feature-list") {
    lines.push("WHAT SHIPPED");
    lines.push("");
    for (const item of scene.items || []) lines.push(`• ${item}`);
  } else {
    lines.push("READY TO SHARE");
    lines.push("");
    lines.push(wrapLines(scene.caption || "Ship it and post the update.", 32));
  }
  await writeFile(textFile, `${lines.join("\n")}\n`, "utf8");
  const drawText = font
    ? `drawtext=fontfile='${font}':textfile='${textFile}':fontcolor=white:fontsize=${scene.type === 'title' ? 56 : 32}:x=90:y=90:line_spacing=14`
    : `drawtext=textfile='${textFile}':fontcolor=white:fontsize=${scene.type === 'title' ? 56 : 32}:x=90:y=90:line_spacing=14`;
  const vf = [
    "drawbox=x=50:y=50:w=1180:h=620:color=white@0.04:t=fill",
    "drawbox=x=70:y=70:w=1140:h=580:color=white@0.08:t=2",
    drawText,
  ].join(",");
  await ffmpegRun([
    "-y",
    "-f", "lavfi",
    "-i", `color=c=0b0f14:s=1280x720:d=${duration}:r=30`,
    "-vf", vf,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    output,
  ]);
  return output;
}

export async function renderStoryboard(storyboard, outputFile) {
  const workdir = await mkdtemp(join(tmpdir(), "cliploop-render-"));
  const font = fontPath();
  try {
    const segments = [];
    const perScene = Math.max(6, Math.floor((storyboard.duration || 45) / Math.max(storyboard.scenes.length || 1, 1)));
    for (let i = 0; i < storyboard.scenes.length; i += 1) {
      const scene = storyboard.scenes[i];
      const duration = i === storyboard.scenes.length - 1 ? Math.max(6, (storyboard.duration || 45) - perScene * (storyboard.scenes.length - 1)) : perScene;
      segments.push(await renderScene({ ...scene, duration }, i, workdir, font));
    }
    const listFile = join(workdir, "list.txt");
    await writeFile(listFile, `${segments.map((item) => `file '${item.replace(/'/g, "'\\''")}'`).join("\n")}\n`, "utf8");
    await ffmpegRun([
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", listFile,
      "-c", "copy",
      outputFile,
    ]);
    return outputFile;
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}
