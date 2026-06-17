import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cliEntry = fileURLToPath(new URL("../bin/cliploop.js", import.meta.url));

function runCli(args, cwd) {
  return spawnSync(process.execPath, [cliEntry, ...args], { cwd, encoding: "utf8" });
}

async function createTempRepo() {
  const dir = await mkdtemp(join(tmpdir(), "cliploop-test-"));
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify(
      {
        name: "demo",
        version: "0.0.0",
        scripts: { build: "echo build", test: "echo test", typecheck: "echo typecheck", lint: "echo lint", dev: "echo dev" },
        dependencies: { next: "15.0.0" },
      },
      null,
      2,
    ),
  );
  await writeFile(join(dir, "tsconfig.json"), "{}\n");
  await writeFile(join(dir, "index.ts"), "export {};\n");
  return dir;
}

test("version output equals cliploop 0.1.0", () => {
  const result = runCli(["--version"], fileURLToPath(new URL("..", import.meta.url)));
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "cliploop 0.1.0");
});

test("init creates .cliploop folder", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cliploop-init-"));
  const result = runCli(["init"], dir);
  assert.equal(result.status, 0, result.stderr);
  for (const rel of [".cliploop", ".cliploop/config.json", ".cliploop/scripts", ".cliploop/storyboards", ".cliploop/renders"]) {
    assert.ok(existsSync(join(dir, rel)), rel);
  }
});

test("init does not overwrite existing files unless --force", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cliploop-init-safe-"));
  runCli(["init"], dir);
  const configPath = join(dir, ".cliploop/config.json");
  const original = await readFile(configPath, "utf8");
  await writeFile(configPath, JSON.stringify({ changed: true }, null, 2) + "\n");
  const result = runCli(["init"], dir);
  assert.equal(result.status, 0);
  assert.equal(await readFile(configPath, "utf8"), JSON.stringify({ changed: true }, null, 2) + "\n");
  const force = runCli(["init", "--force"], dir);
  assert.equal(force.status, 0);
  assert.notEqual(await readFile(configPath, "utf8"), JSON.stringify({ changed: true }, null, 2) + "\n");
  assert.notEqual(await readFile(configPath, "utf8"), original);
});

test("script command creates script", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cliploop-script-"));
  runCli(["init"], dir);
  const result = runCli(["script", "--update", "we shipped SignalLane v0.1.1"], dir);
  assert.equal(result.status, 0, result.stderr);
  const script = await readFile(join(dir, ".cliploop/scripts/latest.md"), "utf8");
  assert.match(script, /SignalLane v0\.1\.1/);
});

test("storyboard command creates valid JSON", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cliploop-storyboard-"));
  runCli(["init"], dir);
  runCli(["script", "--update", "we shipped SignalLane v0.1.1"], dir);
  const result = runCli(["storyboard", "--script", ".cliploop/scripts/latest.md"], dir);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(await readFile(join(dir, ".cliploop/storyboards/latest.json"), "utf8"));
  assert.equal(data.duration, 45);
  assert.equal(data.scenes.length, 4);
  assert.equal(data.scenes[0].type, "title");
});

test("doctor works", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cliploop-doctor-"));
  runCli(["init"], dir);
  runCli(["script", "--update", "we shipped SignalLane v0.1.1"], dir);
  runCli(["storyboard", "--script", ".cliploop/scripts/latest.md"], dir);
  const result = runCli(["doctor"], dir);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /✓ workspace root/);
});
