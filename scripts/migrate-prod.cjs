#!/usr/bin/env node
// Run pending DB migrations before starting the server.
// Handles Render's env-var quoting by reading from @/lib/env which strips quotes.
const { drizzle } = require("drizzle-orm/node-postgres");
const { migrate } = require("drizzle-orm/node-postgres/migrator");
const { Pool } = require("pg");

// Manually replicate the quote-stripping logic from @/lib/env
let raw = process.env.DATABASE_URL || "";
const url = raw.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");

if (url && process.env.MOCK_MODE !== "true") {
  const pool = new Pool({ connectionString: url });
  migrate(drizzle(pool), { migrationsFolder: "./migrations" })
    .then(() => {
      console.log("[migrate] Migrations applied.");
      return pool.end();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[migrate] Failed:", err.message);
      pool.end().then(() => process.exit(1));
    });
} else {
  process.exit(0);
}
