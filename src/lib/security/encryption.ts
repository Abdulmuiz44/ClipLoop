import crypto from "node:crypto";
import { env } from "@/lib/env";

const ALGO = "aes-256-gcm";

function getKey() {
  if (!env.ENCRYPTION_SECRET || env.ENCRYPTION_SECRET.length < 16) {
    throw new Error("ENCRYPTION_SECRET is required for channel token encryption and must be at least 16 characters.");
  }
  return crypto.createHash("sha256").update(env.ENCRYPTION_SECRET).digest();
}

export function encryptText(plainText: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptText(cipherTextBase64: string) {
  const payload = Buffer.from(cipherTextBase64, "base64");
  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
