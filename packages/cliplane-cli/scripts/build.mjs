import { rm, mkdir, cp, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const pkgRoot = dirname(root);
const dist = join(pkgRoot, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(pkgRoot, "src"), join(dist, "src"), { recursive: true });
await cp(join(pkgRoot, "bin"), join(dist, "bin"), { recursive: true });
