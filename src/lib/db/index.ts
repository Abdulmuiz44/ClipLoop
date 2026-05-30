import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

const globalForDb = globalThis as unknown as { pool?: Pool; migrated?: boolean };

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });

// Auto-apply pending migrations on first access (idempotent — safe to run on every boot).
if (!globalForDb.migrated && env.DATABASE_URL && !env.MOCK_MODE) {
  globalForDb.migrated = true;
  migrate(db, { migrationsFolder: "./migrations" }).catch((err) => {
    console.error("[db] Migration failed:", err.message);
  });
}

export { schema };
