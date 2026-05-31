/**
 * Internal admin script: grant smoke-test generation credits.
 *
 * Required env:
 * - GRANT_EMAIL
 * - GRANT_GENERATION_CREDITS
 * - GRANT_REFERENCE
 * - CONFIRM_GRANT=yes
 *
 * Usage:
 * GRANT_EMAIL=abdulmuizproject@gmail.com \
 * GRANT_GENERATION_CREDITS=20 \
 * GRANT_REFERENCE=smoke-test-grant-2026-05-31 \
 * CONFIRM_GRANT=yes \
 * npx tsx scripts/admin/grant-smoke-test-credits.ts
 */

import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getOrCreateCreditAccount } from "@/domains/credits/service";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env: ${name}`);
  }
  return value.trim();
}

function parsePositiveInteger(value: string, max: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${value} is not a positive integer`);
  }
  if (parsed > max) {
    throw new Error(`${value} exceeds maximum allowed value of ${max}`);
  }
  return parsed;
}

async function main() {
  const confirm = process.env.CONFIRM_GRANT;
  if (confirm !== "yes") {
    console.log("Refusing to run: CONFIRM_GRANT must be set to 'yes'.");
    process.exit(0);
  }

  const email = requireEnv("GRANT_EMAIL").toLowerCase();
  const generationCredits = parsePositiveInteger(requireEnv("GRANT_GENERATION_CREDITS"), 50);
  const reference = requireEnv("GRANT_REFERENCE");

  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  if (!user) {
    throw new Error(`No user found for email: ${email}`);
  }

  const existing = await db.query.creditLedgerEntries.findFirst({
    where: and(
      eq(schema.creditLedgerEntries.userId, user.id),
      eq(schema.creditLedgerEntries.referenceType, "admin_smoke_test_grant"),
      eq(schema.creditLedgerEntries.referenceId, reference),
    ),
  });

  if (existing) {
    console.log("Grant already exists.");
    const account = await getOrCreateCreditAccount(user.id);
    const current = await db.query.creditAccounts.findFirst({
      where: eq(schema.creditAccounts.id, account.id),
    });
    console.log(JSON.stringify({
      email,
      userId: user.id,
      creditAccountId: account.id,
      currentGenerationBalance: current?.generationBalance ?? null,
      reference,
    }, null, 2));
    process.exit(0);
  }

  const account = await getOrCreateCreditAccount(user.id);

  const current = await db.query.creditAccounts.findFirst({
    where: eq(schema.creditAccounts.id, account.id),
  });
  if (!current) throw new Error("Credit account missing after creation.");

  const oldBalance = current.generationBalance;
  const newBalance = oldBalance + generationCredits;

  await db.transaction(async (tx) => {
    await tx.insert(schema.creditLedgerEntries).values({
      userId: user.id,
      creditAccountId: account.id,
      bucket: "generation",
      direction: "credit",
      reason: "manual_adjustment",
      amountDelta: generationCredits,
      balanceAfter: newBalance,
      referenceType: "admin_smoke_test_grant",
      referenceId: reference,
      metadataJson: { grantedBy: "admin-script", note: "smoke-test credit grant" },
    });

    await tx
      .update(schema.creditAccounts)
      .set({ generationBalance: newBalance, updatedAt: new Date() })
      .where(eq(schema.creditAccounts.id, account.id));
  });

  console.log(JSON.stringify({
    email,
    userId: user.id,
    creditAccountId: account.id,
    oldGenerationBalance: oldBalance,
    grantedGenerationCredits: generationCredits,
    newGenerationBalance: newBalance,
    reference,
    secretsExposed: false,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
