import test from "node:test";
import assert from "node:assert/strict";
import { validateApiKey, extractApiKeyFromRequest, getEffectiveApiKey } from "@/lib/talocode-auth";

const ORIGINAL_ENV = { ...process.env };

test.after(() => {
  Object.assign(process.env, ORIGINAL_ENV);
});

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

test("talocode-auth: returns null when no auth header", () => {
  const req = new Request("http://localhost");
  assert.equal(extractApiKeyFromRequest(req), null);
});

test("talocode-auth: raw keys not logged", async () => {
  // ensure error messages don't include raw key values
  process.env.TALOCODE_API_KEY = "tk_secret_value";
  const result = validateApiKey(null);
  assert.equal(result.valid, false);
  // no key value should appear in reason
  assert.ok(!result.reason?.includes("tk_"));
});
