import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";

export function findPackageRoot(startDir = dirname(fileURLToPath(import.meta.url))) {
  let current = startDir;
  while (true) {
    if (existsSync(join(current, "package.json"))) return current;
    const next = dirname(current);
    if (next === current) throw new Error("Could not find package.json");
    current = next;
  }
}

export function readPackageJson(startDir = dirname(fileURLToPath(import.meta.url))) {
  const root = findPackageRoot(startDir);
  return JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
}
