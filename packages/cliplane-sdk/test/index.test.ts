import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ClipLane,
  ClipLaneLocal,
} from "../src/index.js";

test("local script generation", async () => {
  const cliplane = new ClipLaneLocal();
  const result = await cliplane.createScript({
    update: "We shipped Codra v0.1.5",
    product: "Codra",
    audience: "builders",
  });

  assert.equal(result.hook, "Turn we shipped codra v0.1.5 into a promo video workflow.");
  assert.match(result.fullScript, /Codra shipped: We shipped Codra v0\.1\.5/i);
  assert.match(result.fullScript, /builders/i);
});

test("local storyboard generation", async () => {
  const cliplane = new ClipLaneLocal();
  const result = await cliplane.createStoryboard({
    update: "We shipped Codra v0.1.5",
    product: "Codra",
    audience: "builders",
  });

  assert.equal(result.title, "Codra video workflow");
  assert.equal(result.duration, 42);
  assert.ok(result.scenes.some((scene) => scene.type === "terminal"));
});

test("x export generation", async () => {
  const cliplane = new ClipLaneLocal();
  const result = await cliplane.exportForX({
    update: "We shipped SignalLane v0.1.1",
    product: "SignalLane",
    audience: "builders",
  });

  assert.match(result.post, /SignalLane/i);
  assert.match(result.post, /#ClipLane/i);
  assert.equal(result.hashtags[0], "ClipLane");
});

test("hosted client requires api key for render", async () => {
  const cliplane = new ClipLane({ baseUrl: "http://localhost:3000" });

  await assert.rejects(
    () =>
      cliplane.createRenderJob({
        update: "We shipped Codra v0.1.5",
        product: "Codra",
      }),
    /ClipLane API key required for hosted rendering/
  );
});

test("local schedules persist, list, and cancel without credentials", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cliplane-sdk-"));
  const cliplane = new ClipLaneLocal({ scheduleStorePath: join(directory, "schedules.json") });
  const job = await cliplane.createSchedule({ runAt: "2027-01-01T00:00:00.000Z", contentId: "video_1" });
  assert.equal((await cliplane.listSchedules())[0]?.id, job.id);
  assert.equal((await cliplane.cancelSchedule(job.id)).status, "cancelled");
});

test("hosted client uses baseUrl override", async () => {
  const requests: Array<{ url: string; headers: HeadersInit | undefined; body: string }> = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({
      url: String(input),
      headers: init?.headers,
      body: String(init?.body ?? ""),
    });

    return new Response(JSON.stringify({
      id: "render_123",
      status: "queued",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const cliplane = new ClipLane({
      apiKey: "cliplane_test_key",
      baseUrl: "http://localhost:3000",
    });

    const job = await cliplane.createRenderJob({
      update: "We shipped Codra v0.1.5",
      product: "Codra",
    });

    assert.equal(job.id, "render_123");
    assert.equal(requests[0]?.url, "http://localhost:3000/v1/renders");
    assert.match(requests[0]?.body ?? "", /Codra/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("hosted scheduling methods use the public scheduling endpoint", async () => {
  const requests: Array<{ url: string; method: string; body: string }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: String(input), method: init?.method ?? "GET", body: String(init?.body ?? "") });
    return new Response(JSON.stringify({ item: { id: "item_123", publishStatus: "scheduled", scheduledFor: "2027-01-01T00:00:00.000Z" }, job: { id: "job_123" }, mode: "created" }), { status: 200 });
  }) as typeof fetch;

  try {
    const cliplane = new ClipLane({ apiKey: "cliplane_test_key", baseUrl: "http://localhost:3000" });
    await cliplane.scheduleContentItem("item/123", { scheduledFor: new Date("2027-01-01T00:00:00.000Z") });
    await cliplane.rescheduleContentItem("item/123", { scheduledFor: "2027-01-02T00:00:00.000Z" });
    await cliplane.cancelScheduledContentItem("item/123");
    await cliplane.getScheduleStatus("item/123");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(requests.map(({ url, method }) => ({ url, method })), [
    { url: "http://localhost:3000/api/public/content-items/item%2F123/schedule", method: "POST" },
    { url: "http://localhost:3000/api/public/content-items/item%2F123/schedule", method: "PATCH" },
    { url: "http://localhost:3000/api/public/content-items/item%2F123/schedule", method: "DELETE" },
    { url: "http://localhost:3000/api/public/content-items/item%2F123/schedule", method: "GET" },
  ]);
  assert.match(requests[0]?.body ?? "", /2027-01-01T00:00:00.000Z/);
});

test("package exports work", async () => {
  const sdk = await import("../src/index.js");
  assert.equal(typeof sdk.ClipLane, "function");
  assert.equal(typeof sdk.ClipLaneLocal, "function");
});

test("typescript types compile", async () => {
  const cliplane = new ClipLaneLocal();
  const script = await cliplane.createScript({
    update: "We shipped Codra v0.1.5",
  });

  assert.equal(typeof script.fullScript, "string");
});

test("api key is not printed or logged", async () => {
  const originalConsoleError = console.error;
  const messages: string[] = [];
  const originalFetch = globalThis.fetch;

  console.error = ((...args: unknown[]) => {
    messages.push(args.map(String).join(" "));
  }) as typeof console.error;
  globalThis.fetch = (async () => {
    throw new Error("network unavailable");
  }) as typeof fetch;

  try {
    const cliplane = new ClipLane({ apiKey: "super-secret-key" });
    await assert.rejects(
      () =>
        cliplane.createRenderJob({
          update: "We shipped Codra v0.1.5",
        }),
      /network unavailable/
    );
  } finally {
    console.error = originalConsoleError;
    globalThis.fetch = originalFetch;
  }

  assert.equal(messages.length, 0);
});
