import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const pkgRoot = dirname(root);
await rm(join(pkgRoot, "dist"), { recursive: true, force: true });
