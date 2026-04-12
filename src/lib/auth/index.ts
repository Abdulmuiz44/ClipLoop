import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";

export async function getOrCreateDemoUser() {
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
}

export async function getCurrentUser() {
  if (env.MOCK_MODE) {
    return getOrCreateDemoUser();
  }

  throw new Error("Real auth is not configured. Enable MOCK_MODE=true for local development.");
}
