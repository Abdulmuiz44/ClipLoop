import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

const rootDir = "/root/projects/cliploop/apps/cliploop-sdk-demo-video";
const outFile = resolve(rootDir, "dist/cliploop-sdk-v0.1.0-demo.mp4");
const textDir = resolve(rootDir, ".render-text");

await mkdir(dirname(outFile), { recursive: true });
await mkdir(textDir, { recursive: true });

const scenes = [
  {
    start: 0,
    end: 6,
    title: "ClipLoop SDK v0.1.0",
    subtitle: "Open Developer API Workflow",
    body: "Use ClipLoop workflows inside your own apps, agents, and dashboards.",
  },
  {
    start: 6,
    end: 12,
    title: "npm install @talocode/cliploop-sdk",
  },
  {
    start: 12,
    end: 18,
    title: "import { ClipLoopLocal } from \"@talocode/cliploop-sdk\";",
    body: "const cliploop = new ClipLoopLocal();\nconst script = await cliploop.createScript({...});\nLocal script generation. No API key required.",
  },
  {
    start: 18,
    end: 24,
    title: "const storyboard = await cliploop.createStoryboard({ script: script.fullScript });",
    body: "Generate structured storyboard data from code.",
  },
  {
    start: 24,
    end: 30,
    title: "const post = await cliploop.exportForX({...});",
    body: "Create launch copy for short-form distribution.",
  },
  {
    start: 30,
    end: 36,
    title: "import { ClipLoop } from \"@talocode/cliploop-sdk\";",
    body: "const cliploop = new ClipLoop({ apiKey: process.env.CLIPLOOP_API_KEY });\nHosted rendering is optional.\nGet API keys at cliploop.site.",
  },
  {
    start: 36,
    end: 42,
    title: "Open workflow. Open CLI. Open SDK. Optional hosted API.",
  },
  {
    start: 42,
    end: 50,
    title: "ClipLoop SDK — Build video workflows into your own products.",
    body: "Part of Talocode.\nnpm install @talocode/cliploop-sdk",
  },
];

const filterParts = [
  "drawbox=x=0:y=0:w=iw:h=ih:color=black@1:t=fill",
];

for (let i = 0; i < scenes.length; i += 1) {
  const scene = scenes[i];
  const titleFile = resolve(textDir, `scene-${i + 1}-title.txt`);
  await writeFile(titleFile, scene.title, "utf8");
  filterParts.push(
    `drawtext=fontcolor=white:fontsize=54:x=(w-text_w)/2:y=120:enable='between(t,${scene.start},${scene.end})':textfile='${titleFile}'`,
  );

  if (scene.subtitle) {
    const subtitleFile = resolve(textDir, `scene-${i + 1}-subtitle.txt`);
    await writeFile(subtitleFile, scene.subtitle, "utf8");
    filterParts.push(
      `drawtext=fontcolor=white:fontsize=34:x=(w-text_w)/2:y=210:enable='between(t,${scene.start},${scene.end})':textfile='${subtitleFile}'`,
    );
  }

  if (scene.body) {
    const bodyFile = resolve(textDir, `scene-${i + 1}-body.txt`);
    await writeFile(bodyFile, scene.body, "utf8");
    filterParts.push(
      `drawtext=fontcolor=white:fontsize=28:x=140:y=340:line_spacing=16:enable='between(t,${scene.start},${scene.end})':textfile='${bodyFile}'`,
    );
  }
}

filterParts.push(
  "drawtext=fontcolor=0x6EF7A4:fontsize=28:x=140:y=1020:enable='between(t,0,50)':text='Open-source. Local-first. Optional hosted API.'",
);

const args = [
  "-y",
  "-f",
  "lavfi",
  "-i",
  "color=c=black:s=1920x1080:r=30:d=50",
  "-vf",
  filterParts.join(","),
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  outFile,
];

await new Promise((resolvePromise, rejectPromise) => {
  const child = spawn("ffmpeg", args, { stdio: "inherit" });
  child.on("error", rejectPromise);
  child.on("exit", (code) => {
    if (code === 0) resolvePromise();
    else rejectPromise(new Error(`ffmpeg exited with code ${code}`));
  });
});

console.log(outFile);
