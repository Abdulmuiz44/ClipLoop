import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";

export const OFFLINE_DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

function isDatabaseUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("ECONNREFUSED") || message.includes("Failed query:");
}

export async function getOrCreateDemoUser() {
  try {
    const existing = await db.query.users.findFirst({ where: eq(schema.users.email, env.DEMO_USER_EMAIL) });
    if (existing) {
      return existing;
    }

    const [created] = await db
      .insert(schema.users)
      .values({
        email: env.DEMO_USER_EMAIL,
        fullName: "ClipLoop Demo User",
        plan: "beta",
        isBetaApproved: true,
        betaApprovedAt: new Date(),
        billingStatus: "beta_access",
      })
      .returning();

    return created;
  } catch (error) {
    if (!env.MOCK_MODE || !isDatabaseUnavailableError(error)) {
      throw error;
    }

    return {
      id: OFFLINE_DEMO_USER_ID,
      email: env.DEMO_USER_EMAIL,
      fullName: "ClipLoop Demo User",
      plan: "beta",
      billingStatus: "offline_mock",
      stripeCustomerId: null,
      lemonSqueezyCustomerId: null,
      isBetaApproved: true,
      betaApprovedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export async function getCurrentUser() {
  if (env.MOCK_MODE) {
    return getOrCreateDemoUser();
  }

  throw new Error("Real auth is not configured. Enable MOCK_MODE=true for local development.");
}
