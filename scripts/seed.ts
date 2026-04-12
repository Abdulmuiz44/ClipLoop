import { db, schema } from "../src/lib/db";
import { env } from "../src/lib/env";
import { eq } from "drizzle-orm";

async function main() {
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, env.DEMO_USER_EMAIL) });
  if (existing) {
    console.log(`Demo user already exists: ${existing.email}`);
    return;
  }

  const [user] = await db
    .insert(schema.users)
    .values({
      email: env.DEMO_USER_EMAIL,
      fullName: "ClipLoop Demo User",
      plan: "free",
    })
    .returning();

  console.log(`Created demo user ${user.email}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
