import { randomUUID } from "node:crypto";
import { cliplanePaths, ensureWorkspace } from "./harness.js";
import { pathExists, readJson, writeJson } from "./utils/fs.js";

async function load(cwd) {
  const file = cliplanePaths(cwd).schedules;
  if (!(await pathExists(file))) return { version: 1, jobs: [] };
  const store = await readJson(file);
  if (!Array.isArray(store.jobs)) throw new Error("Invalid local schedule store.");
  return store;
}

function scheduledFor(value) {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime())) throw new Error("Schedule time must be a valid ISO-8601 timestamp.");
  if (date.getTime() <= Date.now()) throw new Error("Schedule time must be in the future.");
  return date.toISOString();
}

export async function createSchedule(cwd, { runAt, contentId = null, title = null }) {
  const paths = await ensureWorkspace(cwd);
  const store = await load(cwd);
  const job = {
    id: `schedule_${randomUUID()}`,
    contentId,
    title,
    runAt: scheduledFor(runAt),
    status: "scheduled",
    createdAt: new Date().toISOString(),
    cancelledAt: null,
  };
  store.jobs.push(job);
  await writeJson(paths.schedules, store);
  return job;
}

export async function listSchedules(cwd) {
  const store = await load(cwd);
  return store.jobs.sort((a, b) => a.runAt.localeCompare(b.runAt));
}

export async function cancelSchedule(cwd, id) {
  if (!id) throw new Error("Schedule id is required.");
  const paths = await ensureWorkspace(cwd);
  const store = await load(cwd);
  const job = store.jobs.find((item) => item.id === id);
  if (!job) throw new Error(`Local schedule not found: ${id}`);
  if (job.status === "cancelled") return job;
  job.status = "cancelled";
  job.cancelledAt = new Date().toISOString();
  await writeJson(paths.schedules, store);
  return job;
}
