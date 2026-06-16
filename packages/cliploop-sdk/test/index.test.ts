import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ClipLoop,
  ClipLoopLocal,
} from "../src/index.js";

test("local script generation", async () => {
  const cliploop = new ClipLoopLocal();
  const result = await cliploop.createScript({
    update: "We shipped Codra v0.1.5",
    product: "Codra",
    audience: "builders",
  });

  assert.equal(result.hook, "Turn we shipped codra v0.1.5 into a promo video workflow.");
  assert.match(result.fullScript, /Codra shipped: We shipped Codra v0\.1\.5/i);
  assert.match(result.fullScript, /builders/i);
});

test("local storyboard generation", async () => {
  const cliploop = new ClipLoopLocal();
  const result = await cliploop.createStoryboard({
    update: "We shipped Codra v0.1.5",
    product: "Codra",
    audience: "builders",
  });

  assert.equal(result.title, "Codra video workflow");
  assert.equal(result.duration, 42);
  assert.ok(result.scenes.some((scene) => scene.type === "terminal"));
});

test("x export generation", async () => {
  const cliploop = new ClipLoopLocal();
  const result = await cliploop.exportForX({
    update: "We shipped SignalLane v0.1.1",
    product: "SignalLane",
    audience: "builders",
  });

  assert.match(result.post, /SignalLane/i);
  assert.match(result.post, /#ClipLoop/i);
  assert.equal(result.hashtags[0], "ClipLoop");
});

test("hosted client requires api key for render", async () => {
  const cliploop = new ClipLoop({ baseUrl: "http://localhost:3000" });

  await assert.rejects(
    () =>
      cliploop.createRenderJob({
        update: "We shipped Codra v0.1.5",
        product: "Codra",
      }),
    /ClipLoop API key required for hosted rendering/
  );
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
    const cliploop = new ClipLoop({
      apiKey: "cliploop_test_key",
      baseUrl: "http://localhost:3000",
    });

    const job = await cliploop.createRenderJob({
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

test("package exports work", async () => {
  const sdk = await import("../src/index.js");
  assert.equal(typeof sdk.ClipLoop, "function");
  assert.equal(typeof sdk.ClipLoopLocal, "function");
});

test("typescript types compile", async () => {
  const cliploop = new ClipLoopLocal();
  const script = await cliploop.createScript({
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
    const cliploop = new ClipLoop({ apiKey: "super-secret-key" });
    await assert.rejects(
      () =>
        cliploop.createRenderJob({
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
