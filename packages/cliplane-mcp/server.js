#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline";

const storePath = resolve(process.env.CLIPLANE_SCHEDULE_STORE || ".cliplane/schedules.json");

async function load() {
  try {
    const value = JSON.parse(await readFile(storePath, "utf8"));
    if (!Array.isArray(value.jobs)) throw new Error("Invalid local schedule store.");
    return value;
  } catch (error) {
    if (error.code === "ENOENT") return { version: 1, jobs: [] };
    throw error;
  }
}
async function save(store) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`);
}
function runAt(value) {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) throw new Error("runAt must be a future ISO-8601 timestamp.");
  return date.toISOString();
}
const tools = [
  { name: "cliplane_create_schedule", description: "Create a local ClipLane workflow plan. It never publishes content.", inputSchema: { type: "object", properties: { runAt: { type: "string" }, contentId: { type: "string" }, title: { type: "string" } }, required: ["runAt"] } },
  { name: "cliplane_list_schedules", description: "List local ClipLane workflow plans.", inputSchema: { type: "object", properties: {} } },
  { name: "cliplane_cancel_schedule", description: "Cancel a local ClipLane workflow plan.", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
];
async function call(name, args) {
  const store = await load();
  if (name === "cliplane_create_schedule") {
    const job = { id: `schedule_${randomUUID()}`, contentId: args.contentId || null, title: args.title || null, runAt: runAt(args.runAt), status: "scheduled", createdAt: new Date().toISOString(), cancelledAt: null };
    store.jobs.push(job); await save(store); return job;
  }
  if (name === "cliplane_list_schedules") return store.jobs.sort((a, b) => a.runAt.localeCompare(b.runAt));
  if (name === "cliplane_cancel_schedule") {
    const job = store.jobs.find((item) => item.id === args.id);
    if (!job) throw new Error(`Local schedule not found: ${args.id}`);
    if (job.status !== "cancelled") { job.status = "cancelled"; job.cancelledAt = new Date().toISOString(); await save(store); }
    return job;
  }
  throw new Error(`Unknown tool: ${name}`);
}
function respond(message) { process.stdout.write(`${JSON.stringify(message)}\n`); }
createInterface({ input: process.stdin, crlfDelay: Infinity }).on("line", async (line) => {
  try {
    const request = JSON.parse(line);
    if (request.method === "tools/list") return respond({ jsonrpc: "2.0", id: request.id, result: { tools } });
    if (request.method === "tools/call") {
      const result = await call(request.params.name, request.params.arguments || {});
      return respond({ jsonrpc: "2.0", id: request.id, result: { content: [{ type: "text", text: JSON.stringify(result) }] } });
    }
    if (request.method === "initialize") return respond({ jsonrpc: "2.0", id: request.id, result: { protocolVersion: request.params?.protocolVersion || "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "cliplane-local-schedules", version: "0.1.0" } } });
    respond({ jsonrpc: "2.0", id: request.id, error: { code: -32601, message: "Method not found" } });
  } catch (error) { respond({ jsonrpc: "2.0", id: null, error: { code: -32603, message: error instanceof Error ? error.message : "Unknown error" } }); }
});
