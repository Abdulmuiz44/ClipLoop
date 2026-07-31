import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cliplanePaths } from "./harness.js";

export function doctor(cwd) {
  const paths = cliplanePaths(cwd);
  const checks = [
    ["workspace root", existsSync(paths.root)],
    ["config.json", existsSync(paths.config)],
    ["scripts dir", existsSync(paths.scriptsDir)],
    ["storyboards dir", existsSync(paths.storyboardsDir)],
    ["renders dir", existsSync(paths.rendersDir)],
    ["latest script", existsSync(paths.latestScript)],
    ["latest storyboard", existsSync(paths.latestStoryboard)],
  ];
  const invalid = [];
  if (existsSync(paths.config)) {
    try { JSON.parse(readFileSync(paths.config, "utf8")); } catch (error) { invalid.push(`config.json: ${error.message}`); }
  }
  if (existsSync(paths.latestStoryboard)) {
    try { JSON.parse(readFileSync(paths.latestStoryboard, "utf8")); } catch (error) { invalid.push(`latest storyboard: ${error.message}`); }
  }
  return { checks, invalid, ok: checks.every(([, ok]) => ok) && invalid.length === 0 };
}
