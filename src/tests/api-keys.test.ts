import { test } from "node:test";
import assert from "node:assert/strict";

import { generateApiKey, hashApiKey } from "@/lib/security/api-keys";

test("api key generation returns raw key + deterministic hash, without embedding key in hash", async () => {
  const created = generateApiKey();
  assert.ok(created.apiKey.startsWith("clp_"));
  assert.ok(created.keyPrefix.length > 0);

  const h1 = hashApiKey(created.apiKey);
  const h2 = hashApiKey(created.apiKey);
  assert.equal(h1, h2);
  assert.equal(h1.includes(created.apiKey), false);
});
