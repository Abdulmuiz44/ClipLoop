import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function readPackageJson(cwd) {
  const path = join(cwd, "package.json");
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

export function detectPackageManager(cwd) {
  if (existsSync(join(cwd, "bun.lockb")) || existsSync(join(cwd, "bun.lock"))) return "bun";
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(join(cwd, "package-lock.json"))) return "npm";
  return "npm";
}

export function detectFramework(cwd) {
  const pkg = readPackageJson(cwd);
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  if (deps.next || existsSync(join(cwd, "next.config.js")) || existsSync(join(cwd, "next.config.mjs"))) return "Next.js";
  if (deps.vite || existsSync(join(cwd, "vite.config.ts")) || existsSync(join(cwd, "vite.config.js"))) return "Vite";
  if (deps.react) return "React";
  return "";
}

export function detectRepoType(cwd) {
  const pkg = readPackageJson(cwd);
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  if (deps.next) return "next-app";
  if (deps.vite) return "vite-app";
  if (existsSync(join(cwd, "src", "app"))) return "app";
  return "library";
}

export function detectPrimaryLanguage(cwd) {
  const stack = [cwd];
  let ts = 0;
  let js = 0;
  while (stack.length) {
    const dir = stack.pop();
    if (!dir) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next" || entry.name === "dist" || entry.name === "build") continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) ts += 1;
      if (entry.name.endsWith(".js") || entry.name.endsWith(".jsx")) js += 1;
    }
    if (ts + js > 20) break;
  }
  if (ts > 0) return "TypeScript";
  if (js > 0) return "JavaScript";
  return "Unknown";
}

export function detectCommands(cwd) {
  const pkg = readPackageJson(cwd);
  const scripts = pkg?.scripts || {};
  const pick = (...names) => names.map((name) => scripts[name]).find(Boolean) || "";
  return {
    build: pick("build"),
    test: pick("test"),
    typecheck: pick("typecheck"),
    lint: pick("lint"),
    dev: pick("dev"),
  };
}

export function detectProjectName(cwd) {
  return readPackageJson(cwd)?.name || cwd.split("/").filter(Boolean).pop() || "cliploop-project";
}
