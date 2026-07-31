import test from "node:test";
import assert from "node:assert/strict";
import { GET } from "@/app/api/public/weekly-promo/diagnostics/route";

function makeRequest(headers: Record<string, string>) {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as Request;
}

test("diagnostics route refuses without X-ClipLane-Debug: safe", async () => {
  const res = await GET(makeRequest({}));
  assert.ok(res instanceof Response);
  assert.equal(res.status, 401);
  const json = (await res.json()) as Record<string, unknown>;
  assert.equal(json.secretsExposed, false);
});

test("diagnostics response does not include secrets", async () => {
  const res = await GET(makeRequest({ "x-cliplane-debug": "safe" }));
  assert.ok(res instanceof Response);
  assert.equal(res.status, 200);
  const json = (await res.json()) as Record<string, unknown>;
  assert.equal(json.secretsExposed, false);
  const serialized = JSON.stringify(json);
  assert.ok(!serialized.includes("Authorization"));
  assert.ok(!serialized.includes("DATABASE_URL"));
  assert.ok(!serialized.includes("TALOCODE_API_KEY"));
  assert.ok(!serialized.includes("stack"));
  assert.ok(!serialized.includes("raw body"));
  assert.ok(!serialized.includes("api-key"));
});
