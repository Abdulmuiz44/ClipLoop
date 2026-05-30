// @ts-check
// Run pending DB migrations before starting the server.
// Uses __drizzle_migrations tracking table (compatible with Drizzle Kit format).
// Handles Render env-var quoting (strips surrounding quotes from DATABASE_URL).

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function run() {
  // Strip quotes that Render sometimes wraps env var values in
  const raw = process.env.DATABASE_URL || "";
  const url = raw.trim().replace(/^["']|["']$/g, "");

  if (!url || process.env.MOCK_MODE === "true") {
    console.log("[migrate] Skipping (no DATABASE_URL or MOCK_MODE=true)");
    return;
  }

  const pool = new Pool({ connectionString: url });

  // Ensure Drizzle-compatible tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  // Read SQL files in order
  const migrationsDir = path.join(__dirname, "..", "migrations");
  let files = fs.readdirSync(migrationsDir).filter((f) => /^\d+.*\.sql$/.test(f));
  files.sort();

  for (const file of files) {
    const hash = file.replace(/\.sql$/, "");

    // Check if already applied
    const { rows } = await pool.query(
      'SELECT 1 FROM "__drizzle_migrations" WHERE hash = $1',
      [hash]
    );
    if (rows.length > 0) {
      console.log(`[migrate] Skipping ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`[migrate] Applying ${file}...`);
    await pool.query(sql);
    await pool.query(
      'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
      [hash, Date.now()]
    );
    console.log(`[migrate] Applied ${file}`);
  }

  console.log("[migrate] All migrations applied.");
  await pool.end();
}

run().catch((err) => {
  console.error("[migrate] Fatal:", err.message);
  process.exit(1);
});
