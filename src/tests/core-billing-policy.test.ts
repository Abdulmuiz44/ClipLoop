import test from "node:test";
import assert from "node:assert/strict";
import { BILLING_POLICY, getBillingPolicy } from "@/core/billing/policy";

test("billing policy preserves billable and non-billable actions", () => {
  assert.equal(getBillingPolicy("plain_chat").billable, false);
  assert.equal(getBillingPolicy("content_item_render").billable, true);

  const renderPolicy = getBillingPolicy("content_item_render");
  if (!renderPolicy.billable) {
    throw new Error("Expected render policy to be billable");
  }

  assert.equal(renderPolicy.bucket, "render");
  assert.equal(renderPolicy.amount, 1);
  assert.ok(BILLING_POLICY.manual_queue_ops);
});

