import test from "node:test";
import assert from "node:assert/strict";
import {
  getGatewayAuth,
  getGatewayConfig,
  getGatewayCreditGuard,
  getGatewayProviderAccess,
} from "@/gateway";

test("gateway config defaults to local app mode", () => {
  const config = getGatewayConfig();
  assert.equal(config.mode, "local_app");
  assert.equal(typeof config.defaultRateLimitPerMinute, "number");
});

test("gateway local auth resolves session users", async () => {
  const auth = getGatewayAuth();
  const identity = await auth.authenticate({ userId: "user_123" });
  assert.ok(identity);
  assert.equal(identity?.mode, "session_user");
  assert.equal(identity?.actorId, "user_123");
});

test("gateway provider access defaults to local provider mode", async () => {
  const providerAccess = getGatewayProviderAccess();
  const resolved = await providerAccess.resolve({ provider: "mistral" });
  assert.equal(resolved.provider, "mistral");
  assert.equal(resolved.mode, "local");
});

test("gateway credit guard allows non-billable actions without charging", async () => {
  const guard = getGatewayCreditGuard();
  const result = await guard.preflight({ userId: "user_123", action: "plain_chat" });
  assert.equal(result.allowed, true);
});

