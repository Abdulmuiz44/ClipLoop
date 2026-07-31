import { cwd } from "node:process";
import { readdirSync } from "node:fs";
import { cliplanePaths, initWorkspace, ensureWorkspace } from "./harness.js";
import { createScript } from "./script.js";
import { createStoryboard } from "./storyboard.js";
import { renderWorkspace } from "./render.js";
import { exportForX } from "./export.js";
import { doctor } from "./doctor.js";
import { readPackageJson } from "./utils/package.js";
import { pathExists, readJson } from "./utils/fs.js";
import { cancelSchedule, createSchedule, listSchedules } from "./schedule.js";

function getVersion() {
  return readPackageJson(new URL(".", import.meta.url).pathname).version;
}

function printVersion() {
  console.log(`cliplane ${getVersion()}`);
}

function parseArgv(argv) {
  const args = [...argv];
  const command = args.shift();
  const options = {};
  while (args.length) {
    const item = args.shift();
    if (!item) break;
    if (item === "--force") options.force = true;
    else if (item === "--update") options.update = args.shift() || "";
    else if (item === "--script") options.script = args.shift() || "";
    else if (item === "--output") options.output = args.shift() || "";
    else if (item === "--at") options.at = args.shift() || "";
    else if (item === "--content") options.content = args.shift() || "";
    else if (item === "--title") options.title = args.shift() || "";
    else if (item === "--id") options.id = args.shift() || "";
    else if (!options._) options._ = [item];
    else options._.push(item);
  }
  return { command, options };
}

export async function run(argv = process.argv.slice(2), workingDir = cwd()) {
  if (argv.length === 0 || argv[0] === "--version" || argv[0] === "-V" || argv[0] === "version") {
    printVersion();
    return 0;
  }
  const { command, options } = parseArgv(argv);
  if (command === "--version" || command === "-V" || command === "version") {
    printVersion();
    return 0;
  }
  if (command === "init") {
    const result = await initWorkspace(workingDir, { force: Boolean(options.force) });
    console.log(result.created ? "cliplane init: created .cliplane" : "cliplane init: .cliplane already exists");
    return 0;
  }
  if (command === "script") {
    if (!options.update) throw new Error('cliplane script requires --update "..."');
    const result = await createScript(workingDir, options.update);
    console.log(result.path);
    return 0;
  }
  if (command === "storyboard") {
    const scriptPath = options.script || cliplanePaths(workingDir).latestScript;
    const result = await createStoryboard(workingDir, scriptPath);
    console.log(result.path);
    return 0;
  }
  if (command === "render") {
    await ensureWorkspace(workingDir);
    const storyboardPath = cliplanePaths(workingDir).latestStoryboard;
    if (!(await pathExists(storyboardPath))) {
      throw new Error("No storyboard found. Run `cliplane storyboard --script ...` first.");
    }
    const storyboard = await readJson(storyboardPath);
    const result = await renderWorkspace(workingDir, storyboard, { renderer: process.env.CLIPLANE_RENDERER || "ffmpeg" });
    console.log(result.output);
    return 0;
  }
  if (command === "export") {
    const target = options._?.[0] || "x";
    if (target !== "x") throw new Error("Only `cliplane export x` is supported in v0.1.0.");
    const storyboardPath = cliplanePaths(workingDir).latestStoryboard;
    if (!(await pathExists(storyboardPath))) {
      throw new Error("No storyboard found. Run `cliplane storyboard --script ...` first.");
    }
    const storyboard = await readJson(storyboardPath);
    const renderDir = cliplanePaths(workingDir).rendersDir;
    const renderFiles = readdirSync(renderDir).filter((name) => name.endsWith(".mp4")).sort();
    const renderPath = renderFiles.length ? `${renderDir}/${renderFiles.at(-1)}` : "(render first)";
    const exportData = exportForX({ storyboard, renderPath, script: "" });
    console.log(exportData.recommendedPost);
    console.log("");
    console.log("Video filename:");
    console.log(exportData.videoFilename);
    console.log("");
    console.log("Release/demo checklist:");
    for (const item of exportData.releaseDemoChecklist) console.log(`- ${item}`);
    return 0;
  }
  if (command === "doctor") {
    const result = doctor(workingDir);
    for (const [label, ok] of result.checks) console.log(`${ok ? "✓" : "✗"} ${label}`);
    for (const item of result.invalid) console.log(`✗ ${item}`);
    if (!result.ok) throw new Error("ClipLane doctor failed");
    return 0;
  }
  if (command === "schedule") {
    const action = options._?.[0] || "list";
    if (action === "create") {
      const job = await createSchedule(workingDir, { runAt: options.at, contentId: options.content || null, title: options.title || null });
      console.log(JSON.stringify(job, null, 2));
      return 0;
    }
    if (action === "list" || action === "status") {
      console.log(JSON.stringify(await listSchedules(workingDir), null, 2));
      return 0;
    }
    if (action === "cancel") {
      const job = await cancelSchedule(workingDir, options.id || options._?.[1]);
      console.log(JSON.stringify(job, null, 2));
      return 0;
    }
    throw new Error("Use `schedule create`, `schedule list`, `schedule status`, or `schedule cancel`.");
  }
  throw new Error(`Unknown command: ${command}`);
}
