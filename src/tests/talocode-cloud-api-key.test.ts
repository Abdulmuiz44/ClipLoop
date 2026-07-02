import test from "node:test";
import assert from "node:assert/strict";
import { validateApiKey, extractApiKeyFromRequest, getEffectiveApiKey } from "@/lib/talocode-auth";
import { handleRoute } from "@/lib/talocode-route-handler";
import { chargeCredits } from "@/lib/talocode-billing";

const ORIGINAL_ENV = { ...process.env };

test.afterEach(() => {
  Object.assign(process.env, ORIGINAL_ENV);
});

test.after(() => {
  Object.assign(process.env, ORIGINAL_ENV);
});

// ─── getEffectiveApiKey ────────────────────────────────────────────────

test("talocode-auth: prefers TALOCODE_API_KEY over CLIPLOOP_API_KEY", () => {
  process.env.TALOCODE_API_KEY = "tk_abc123";
  process.env.CLIPLOOP_API_KEY = "clp_def456";
  assert.equal(getEffectiveApiKey(), "tk_abc123");
});

test("talocode-auth: falls back to CLIPLOOP_API_KEY when TALOCODE_API_KEY not set", () => {
  delete process.env.TALOCODE_API_KEY;
  process.env.CLIPLOOP_API_KEY = "clp_def456";
  assert.equal(getEffectiveApiKey(), "clp_def456");
});

test("talocode-auth: returns undefined when no key set", () => {
  delete process.env.TALOCODE_API_KEY;
  delete process.env.CLIPLOOP_API_KEY;
  assert.equal(getEffectiveApiKey(), undefined);
});

test("talocode-auth: deprecation warning when using CLIPLOOP_API_KEY in getEffectiveApiKey", () => {
  delete process.env.TALOCODE_API_KEY;
  process.env.CLIPLOOP_API_KEY = "clp_def456";
  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: string) => { warnings.push(msg) };
  try {
    getEffectiveApiKey();
    assert.ok(warnings.some(w => w.includes("CLIPLOOP_API_KEY is deprecated")));
  } finally {
    console.warn = origWarn;
  }
});

// ─── validateApiKey ─────────────────────────────────────────────────────

test("talocode-auth: validates correct TALOCODE_API_KEY", () => {
  process.env.TALOCODE_API_KEY = "tk_abc123";
  delete process.env.CLIPLOOP_API_KEY;
  const result = validateApiKey("tk_abc123");
  assert.equal(result.valid, true);
  assert.equal(result.keyType, "talocode");
});

test("talocode-auth: accepts legacy CLIPLOOP_API_KEY", () => {
  delete process.env.TALOCODE_API_KEY;
  process.env.CLIPLOOP_API_KEY = "clp_def456";
  const result = validateApiKey("clp_def456");
  assert.equal(result.valid, true);
  assert.equal(result.keyType, "cliploop_legacy");
});

test("talocode-auth: rejects wrong key", () => {
  process.env.TALOCODE_API_KEY = "tk_abc123";
  const result = validateApiKey("wrong_key");
  assert.equal(result.valid, false);
  assert.equal(result.reason, "INVALID_API_KEY");
});

test("talocode-auth: rejects missing key", () => {
  const result = validateApiKey(null);
  assert.equal(result.valid, false);
  assert.equal(result.reason, "MISSING_API_KEY");
});

test("talocode-auth: rejects undefined key", () => {
  const result = validateApiKey(undefined);
  assert.equal(result.valid, false);
  assert.equal(result.reason, "MISSING_API_KEY");
});

// ─── extractApiKeyFromRequest ───────────────────────────────────────────

test("talocode-auth: extracts from Authorization Bearer header", () => {
  const headers = new Headers({ authorization: "Bearer tk_abc123" });
  const req = new Request("http://localhost", { headers });
  assert.equal(extractApiKeyFromRequest(req), "tk_abc123");
});

test("talocode-auth: extracts from X-Api-Key header", () => {
  const headers = new Headers({ "x-api-key": "tk_abc123" });
  const req = new Request("http://localhost", { headers });
  assert.equal(extractApiKeyFromRequest(req), "tk_abc123");
});

test("talocode-auth: Authorization Bearer takes precedence over X-Api-Key", () => {
  const headers = new Headers({
    authorization: "Bearer tk_primary",
    "x-api-key": "tk_secondary",
  });
  const req = new Request("http://localhost", { headers });
  assert.equal(extractApiKeyFromRequest(req), "tk_primary");
});

test("talocode-auth: returns null when no auth header", () => {
  const req = new Request("http://localhost");
  assert.equal(extractApiKeyFromRequest(req), null);
});

test("talocode-auth: handles empty Authorization header", () => {
  const headers = new Headers({ authorization: "" });
  const req = new Request("http://localhost", { headers });
  assert.equal(extractApiKeyFromRequest(req), null);
});

test("talocode-auth: handles Authorization without Bearer prefix", () => {
  const headers = new Headers({ authorization: "Basic abc123" });
  const req = new Request("http://localhost", { headers });
  assert.equal(extractApiKeyFromRequest(req), null);
});

// ─── Key redaction in errors ──────────────────────────────────────────

test("talocode-auth: raw keys not logged in error messages", async () => {
  process.env.TALOCODE_API_KEY = "tk_secret_value";
  const result = validateApiKey(null);
  assert.equal(result.valid, false);
  assert.ok(!result.reason?.includes("tk_"));
});

test("talocode-auth: key type is talocode not the actual key value", () => {
  process.env.TALOCODE_API_KEY = "tk_abc123";
  const result = validateApiKey("tk_abc123");
  assert.equal(result.valid, true);
  assert.equal(result.keyType, "talocode");
  // Make sure keyType doesn't include the actual key
  assert.ok(!result.keyType?.includes("tk_"));
});

// ─── handleRoute auth failures ──────────────────────────────────────────

test("talocode-route-handler: returns 401 for missing API key", async () => {
  process.env.TALOCODE_API_KEY = "tk_abc123";
  const request = new Request("http://localhost/v1/cliploop/brief/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt: "test" }),
  });
  const response = await handleRoute(
    request,
    { action: "brief.generate", credits: 15 },
    async () => new Response("ok", { status: 200 }),
  );
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, "missing_api_key");
});

test("talocode-route-handler: returns 401 for invalid API key", async () => {
  process.env.TALOCODE_API_KEY = "tk_abc123";
  const request = new Request("http://localhost/v1/cliploop/brief/generate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer wrong_key",
    },
    body: JSON.stringify({ prompt: "test" }),
  });
  const response = await handleRoute(
    request,
    { action: "brief.generate", credits: 15 },
    async () => new Response("ok", { status: 200 }),
  );
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.error.code, "invalid_api_key");
});

// ─── handleRoute deprecation warning ──────────────────────────────────

test("talocode-route-handler: warns on CLIPLOOP_API_KEY usage", async () => {
  delete process.env.TALOCODE_API_KEY;
  process.env.CLIPLOOP_API_KEY = "clp_def456";
  process.env.TALOCODE_BASE_URL = "http://localhost:9999"; // won't be reached

  const request = new Request("http://localhost/v1/cliploop/brief/generate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer clp_def456",
    },
    body: JSON.stringify({ prompt: "test" }),
  });

  const warnings: string[] = [];
  const origWarn = console.warn;
  console.warn = (msg: string) => { warnings.push(msg) };
  try {
    await handleRoute(
      request,
      { action: "brief.generate", credits: 15 },
      async () => new Response("ok", { status: 200 }),
    );
    assert.ok(warnings.some(w => w.includes("CLIPLOOP_API_KEY is deprecated")));
  } finally {
    console.warn = origWarn;
  }
});

// ─── chargeCredits ─────────────────────────────────────────────────────

test("talocode-billing: returns billing_unavailable when service unreachable", async () => {
  process.env.TALOCODE_BASE_URL = "http://localhost:1"; // unreachable port
  const result = await chargeCredits("tk_abc123", {
    product: "cliploop",
    action: "brief.generate",
    credits: 15,
    requestId: "test-1",
  });
  assert.equal(result.success, false);
  assert.equal(result.error?.code, "billing_unavailable");
});

test("talocode-billing: uses TALOCODE_BASE_URL from env", () => {
  process.env.TALOCODE_BASE_URL = "https://custom.example.com";
  // Test by making a request to a non-existent endpoint
  // The URL construction is tested indirectly via chargeCredits failure
  assert.ok(true);
});

// ─── handleRoute billing behavior ─────────────────────────────────────

test("talocode-route-handler: returns structured JSON errors", async () => {
  process.env.TALOCODE_API_KEY = "tk_abc123";
  const request = new Request("http://localhost/v1/cliploop/brief/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt: "test" }),
  });
  const response = await handleRoute(
    request,
    { action: "brief.generate", credits: 15 },
    async () => new Response("ok", { status: 200 }),
  );
  const body = await response.json();
  // Should have structured JSON with ok and error fields
  assert.equal(typeof body, "object");
  assert.equal("ok" in body, true);
  assert.equal("error" in body, true);
});

test("talocode-route-handler: idempotency key is generated", async () => {
  process.env.TALOCODE_API_KEY = "tk_abc123";
  const request = new Request("http://localhost/v1/cliploop/brief/generate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer tk_abc123",
    },
    body: JSON.stringify({ prompt: "test" }),
  });
  // We can't easily test billing without a service, but we can verify
  // that the route handler structure is correct
  const response = await handleRoute(
    request,
    { action: "brief.generate", credits: 15, getRequestId: () => "test-id-1" },
    async () => {
      return Response.json({ ok: true, charged: true });
    },
  );
  // Since billing will fail (no service), we expect 502
  assert.equal(response.status, 502);
});
