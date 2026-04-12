import { spawn, spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { RenderTemplate } from "@/lib/render/templates";

export class FfmpegUnavailableError extends Error {
  constructor() {
    super("FFmpeg is not installed or not available in PATH. Install FFmpeg and retry rendering.");
  }
}

function escapeForDrawtext(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\\\'")
    .replace(/%/g, "\\%")
    .replace(/\n/g, "\\n");
}

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    proc.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    proc.on("error", (error) => reject(error));
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg command failed (${code}): ${stderr}`));
      }
    });
  });
}

export function assertFfmpegAvailable() {
  const check = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  if (check.status !== 0) {
    throw new FfmpegUnavailableError();
  }
}

export async function renderSlidesToVideo({
  slides,
  footerText,
  template,
  workDir,
  outputVideoPath,
}: {
  slides: string[];
  footerText: string;
  template: RenderTemplate;
  workDir: string;
  outputVideoPath: string;
}) {
  await fs.mkdir(workDir, { recursive: true });

  const segmentPaths: string[] = [];
  for (let i = 0; i < slides.length; i += 1) {
    const segmentPath = path.join(workDir, `segment-${i + 1}.mp4`);
    segmentPaths.push(segmentPath);
    const text = escapeForDrawtext(slides[i]);
    const footer = escapeForDrawtext(footerText);

    await runCommand("ffmpeg", [
      "-y",
      "-f",
      "lavfi",
      "-i",
      `color=c=${template.bgColor}:s=${template.width}x${template.height}:d=${template.slideDurationSec}`,
      "-vf",
      [
        `drawtext=text='${text}':fontcolor=${template.textColor}:fontsize=${template.fontSize}:x=(w-text_w)/2:y=(h-text_h)/2:line_spacing=16:box=1:boxcolor=${template.boxColor}:boxborderw=30`,
        `drawtext=text='${footer}':fontcolor=${template.footerColor}:fontsize=32:x=(w-text_w)/2:y=h-120`,
      ].join(","),
      "-r",
      String(template.fps),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      segmentPath,
    ]);
  }

  const concatFilePath = path.join(workDir, "segments.txt");
  const concatFile = segmentPaths.map((segment) => `file '${segment.replace(/'/g, "'\\''")}'`).join("\n");
  await fs.writeFile(concatFilePath, concatFile, "utf8");

  await runCommand("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatFilePath,
    "-c",
    "copy",
    outputVideoPath,
  ]);
}

export async function generateThumbnail(videoPath: string, thumbnailPath: string) {
  await runCommand("ffmpeg", ["-y", "-ss", "00:00:01", "-i", videoPath, "-frames:v", "1", thumbnailPath]);
}
