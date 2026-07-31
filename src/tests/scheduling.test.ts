import test from "node:test";
import assert from "node:assert/strict";
import { assertFutureSchedule, retryDelayMs } from "@/domains/publishing/scheduling";

test("service scheduling guard rejects invalid or non-future times", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  assert.throws(() => assertFutureSchedule(new Date("invalid"), now));
  assert.throws(() => assertFutureSchedule(now, now));
  assert.doesNotThrow(() => assertFutureSchedule(new Date("2026-01-01T00:00:00.001Z"), now));
});

test("retry delays grow exponentially and are capped", () => {
  assert.equal(retryDelayMs(1), 5 * 60 * 1000);
  assert.equal(retryDelayMs(2), 10 * 60 * 1000);
  assert.equal(retryDelayMs(10), 60 * 60 * 1000);
});
