import crypto from "node:crypto";

const API_KEY_PREFIX = "clp_";
const DEFAULT_KEY_BYTES = 32;

function getPepper() {
  // Use existing secrets only. Avoid introducing new env vars.
  return process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || "";
}

export function generateApiKey(): { apiKey: string; keyPrefix: string; keyHash: string } {
  const token = crypto.randomBytes(DEFAULT_KEY_BYTES).toString("base64url");
  const apiKey = `${API_KEY_PREFIX}${token}`;
  const keyPrefix = apiKey.slice(0, Math.min(12, apiKey.length));
  const keyHash = hashApiKey(apiKey);
  return { apiKey, keyPrefix, keyHash };
}

export function hashApiKey(apiKey: string): string {
  const pepper = getPepper();
  // Hash is deterministic so we can look up by hash. Pepper makes rainbow attacks harder.
  return crypto.createHash("sha256").update(`${pepper}:${apiKey}`).digest("hex");
}

export function isProbablyApiKey(input: string) {
  return input.startsWith(API_KEY_PREFIX) && input.length > API_KEY_PREFIX.length + 10;
}
