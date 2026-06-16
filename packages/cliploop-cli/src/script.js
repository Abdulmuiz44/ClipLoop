import { writeScript } from "./harness.js";

export function generateScript(update) {
  const clean = String(update || "").trim();
  const product = clean.match(/(?:shipped|launched|released)\s+([A-Za-z0-9._/-]+)/i)?.[1] || "your product";
  return [
    "# ClipLoop launch script",
    "",
    `Hook: We just shipped ${clean || product}.`,
    "",
    "Problem: product updates deserve a fast promo video, not a blank page.",
    "",
    `What shipped: ${clean || "a new product update"}.`,
    "",
    "Why it matters: makers can turn updates into short-form promo content locally, with no hosted workflow required.",
    "",
    'Install/use command: cliploop init && cliploop script --update "..." && cliploop storyboard --script .cliploop/scripts/latest.md && cliploop render',
    "",
    "Closing CTA: Ship the update, export the video, and share it today.",
  ].join("\n");
}

export async function createScript(cwd, update) {
  const markdown = generateScript(update);
  const path = await writeScript(cwd, markdown);
  return { path, markdown };
}
