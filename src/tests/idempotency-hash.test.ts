import { test } from "node:test";
import assert from "node:assert/strict";

import { computeRequestHash } from "@/lib/public-api/idempotency";

test("computeRequestHash changes when payload changes", async () => {
  const h1 = computeRequestHash({ method: "POST", path: "/api/public/weekly-promo", body: { a: 1, b: 2 } });
  const h2 = computeRequestHash({ method: "POST", path: "/api/public/weekly-promo", body: { a: 1, b: 3 } });
  assert.notEqual(h1, h2);
});

test("computeRequestHash is stable for key order", async () => {
  const h1 = computeRequestHash({ method: "POST", path: "/api/public/weekly-promo", body: { a: 1, b: 2 } });
  const h2 = computeRequestHash({ method: "POST", path: "/api/public/weekly-promo", body: { b: 2, a: 1 } });
  assert.equal(h1, h2);
});
