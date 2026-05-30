// Create an API key for E2E testing using the project's DB connection
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiKey } from "@/domains/api-keys/service";

async function main() {
  // Find users with existing sessions/plan states
  const users = await db.select().from(schema.users).limit(5);
  console.log(`Users found: ${users.length}`);
  
  if (users.length === 0) {
    console.log("NO_USERS");
    process.exit(1);
  }
  
  for (const u of users) {
    const keys = await db.select().from(schema.apiKeys)
      .where(eq(schema.apiKeys.userId, u.id))
      .limit(5);
    console.log(`User ${u.id.slice(0,12)}.. email=${u.email?.slice(0,30)} keys=${keys.length}`);
    
    for (const k of keys) {
      console.log(`  EXISTING_KEY:${k.keyPrefix}`);
    }
    
    // Check credit balance
    try {
      const credits = await db.select().from(schema.creditAccounts)
        .where(eq(schema.creditAccounts.userId, u.id))
        .limit(1);
      if (credits.length > 0) {
        console.log(`  Credits: gen=${credits[0].generationBalance} render=${credits[0].renderBalance}`);
      }
    } catch {}
    
    // Create a new key for testing
    const result = await createApiKey({
      userId: u.id,
      label: "E2E Prod Test Key",
      scopes: ["weekly_promo:generate"],
    });
    console.log(`  NEW_KEY_PREFIX:${result.keyPrefix}`);
    console.log(`  NEW_KEY_FULL:${result.apiKey}`);
    
    // Only create for first user
    break;
  }
}

main().catch(e => console.error("FAILED:", e.message));
