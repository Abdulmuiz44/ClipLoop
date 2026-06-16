import { join } from "node:path";
import { ensureDir, pathExists, readJson, writeJson, writeText } from "./utils/fs.js";
import { detectFramework, detectPackageManager, detectPrimaryLanguage, detectProjectName, detectRepoType } from "./detect.js";

export function cliploopRoot(cwd) {
  return join(cwd, ".cliploop");
}

export function cliploopPaths(cwd) {
  const root = cliploopRoot(cwd);
  return {
    root,
    config: join(root, "config.json"),
    scriptsDir: join(root, "scripts"),
    storyboardsDir: join(root, "storyboards"),
    rendersDir: join(root, "renders"),
    latestScript: join(root, "scripts", "latest.md"),
    latestStoryboard: join(root, "storyboards", "latest.json"),
  };
}

export async function ensureWorkspace(cwd) {
  const paths = cliploopPaths(cwd);
  await ensureDir(paths.scriptsDir);
  await ensureDir(paths.storyboardsDir);
  await ensureDir(paths.rendersDir);
  return paths;
}

export async function initWorkspace(cwd, { force = false } = {}) {
  const paths = await ensureWorkspace(cwd);
  const existed = await pathExists(paths.config);
  if (existed && !force) {
    return { created: false, paths, config: await readJson(paths.config) };
  }
  const config = {
    name: detectProjectName(cwd),
    description: "Local-first workflow layer for turning product updates into promo videos.",
    packageManager: detectPackageManager(cwd),
    primaryLanguage: detectPrimaryLanguage(cwd),
    framework: detectFramework(cwd),
    repoType: detectRepoType(cwd),
    createdAt: new Date().toISOString(),
  };
  await writeJson(paths.config, config);
  return { created: true, paths, config };
}

export async function loadConfig(cwd) {
  const paths = cliploopPaths(cwd);
  if (!(await pathExists(paths.config))) return null;
  return readJson(paths.config);
}

export async function writeScript(cwd, content) {
  const paths = await ensureWorkspace(cwd);
  await writeText(paths.latestScript, content);
  return paths.latestScript;
}

export async function writeStoryboard(cwd, storyboard) {
  const paths = await ensureWorkspace(cwd);
  await writeJson(paths.latestStoryboard, storyboard);
  return paths.latestStoryboard;
}

export async function readStoryboard(cwd, path = null) {
  const paths = cliploopPaths(cwd);
  const file = path || paths.latestStoryboard;
  return readJson(file);
}

export async function readScript(cwd, path = null) {
  const { readFile } = await import("node:fs/promises");
  const paths = cliploopPaths(cwd);
  const file = path || paths.latestScript;
  return readFile(file, "utf8");
}
