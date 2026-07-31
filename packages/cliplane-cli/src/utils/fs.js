import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function writeJson(path, value, space = 2) {
  await ensureDir(dirname(path));
  await writeFile(path, `${JSON.stringify(value, null, space)}
`, "utf8");
}

export async function writeText(path, content) {
  await ensureDir(dirname(path));
  await writeFile(path, content, "utf8");
}
