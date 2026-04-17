import { spawn, spawnSync } from "node:child_process";
import { env } from "@/lib/env";

export class HyperframesUnavailableError extends Error {
  constructor() {
    super("HyperFrames CLI is not installed or not available in PATH. Install HyperFrames CLI and set HYPERFRAMES_BIN if needed.");
  }
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
        reject(new Error(`HyperFrames command failed (${code}): ${stderr}`));
      }
    });
  });
}

export function assertHyperframesAvailable() {
  const bin = env.HYPERFRAMES_BIN;
  const check = spawnSync(bin, ["--version"], { encoding: "utf8" });
  if (check.status !== 0) {
    throw new HyperframesUnavailableError();
  }
}

export async function renderWithHyperframesCli(params: {
  compositionHtmlPath: string;
  outputVideoPath: string;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
}) {
  const bin = env.HYPERFRAMES_BIN;
  await runCommand(bin, [
    "render",
    "--input",
    params.compositionHtmlPath,
    "--output",
    params.outputVideoPath,
    "--width",
    String(params.width),
    "--height",
    String(params.height),
    "--fps",
    String(params.fps),
    "--duration",
    String(params.durationSec),
  ]);
}
