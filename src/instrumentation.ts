import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export async function register() {
  const DATABASE_URL = process.env.DATABASE_URL;
  const MOCK_MODE = process.env.MOCK_MODE;

  if (!DATABASE_URL || MOCK_MODE === "true") return;

  // Strip surrounding quotes (Render stores env vars as "\"value\"")
  const url = DATABASE_URL.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");

  const pool = new Pool({ connectionString: url });

  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("[instrumentation] Migrations applied successfully.");
  } catch (err) {
    console.error("[instrumentation] Migration failed:", err instanceof Error ? err.message : err);
  } finally {
    await pool.end().catch(() => {});
  }
}
