import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("ClipLane MCP exposes local schedule tools", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cliplane-mcp-"));
  const child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, CLIPLANE_SCHEDULE_STORE: join(directory, "schedules.json") },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" })}\n`);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("MCP server did not respond")), 5_000);
    child.stdout.once("data", () => { clearTimeout(timeout); resolve(); });
  });
  child.kill();
  await new Promise((resolve) => child.once("exit", resolve));
  await rm(directory, { recursive: true, force: true });
  const response = JSON.parse(output.trim());
  assert.equal(response.result.tools[0].name, "cliplane_create_schedule");
});
