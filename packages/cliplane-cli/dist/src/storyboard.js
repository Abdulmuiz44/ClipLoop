import { writeStoryboard, readScript } from "./harness.js";

function sectionValue(markdown, label) {
  const match = markdown.match(new RegExp(`^${label}:\\s*(.+)$`, "mi"));
  return match ? match[1].trim() : "";
}

export function storyboardFromScript(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const hook = sectionValue(markdown, "Hook") || lines.find((line) => line.trim()) || "Launch your update";
  const what = sectionValue(markdown, "What shipped") || hook;
  const why = sectionValue(markdown, "Why it matters") || "Turn product updates into promo videos locally.";
  const install = sectionValue(markdown, "Install/use command") || 'cliplane init && cliplane script --update "..."';
  const cta = sectionValue(markdown, "Closing CTA") || "Ship the update and share the video.";
  return {
    title: hook.replace(/^Hook:\s*/i, ""),
    duration: 45,
    scenes: [
      { type: "title", caption: hook, visual: "dark title card" },
      { type: "terminal", command: install, caption: what },
      { type: "feature-list", items: [what, why, "No login. No hosted service. No fake claims."] },
      { type: "cta", caption: cta },
    ],
  };
}

export async function createStoryboard(cwd, scriptPath) {
  const markdown = await readScript(cwd, scriptPath);
  const storyboard = storyboardFromScript(markdown);
  const path = await writeStoryboard(cwd, storyboard);
  return { path, storyboard };
}
