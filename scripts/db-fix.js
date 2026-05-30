// @ts-check
// Apply missing DB columns at startup. Idempotent — uses IF NOT EXISTS.
// Handles Render env-var quoting.

const { Pool } = require("pg");

async function run() {
  const raw = process.env.DATABASE_URL || "";
  const url = raw.trim().replace(/^["']|["']$/g, "");

  if (!url || process.env.MOCK_MODE === "true") {
    console.log("[db-fix] Skipping (no DATABASE_URL or MOCK_MODE=true)");
    return;
  }

  const pool = new Pool({ connectionString: url });

  const fixes = [
    // 0006: billing access limits
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_beta_approved" boolean NOT NULL DEFAULT false`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "beta_approved_at" timestamptz`,
    `CREATE INDEX IF NOT EXISTS "users_is_beta_approved_idx" ON "users" ("is_beta_approved")`,
    `CREATE INDEX IF NOT EXISTS "usage_counters_user_period_idx" ON "usage_counters" ("user_id", "period_start", "period_end")`,
    `CREATE TABLE IF NOT EXISTS "subscriptions" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "stripe_subscription_id" text, "stripe_price_id" text, "status" text NOT NULL DEFAULT 'incomplete', "current_period_start" timestamptz, "current_period_end" timestamptz, "cancel_at_period_end" boolean NOT NULL DEFAULT false, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now())`,
    `CREATE INDEX IF NOT EXISTS "subscriptions_user_id_idx" ON "subscriptions" ("user_id")`,
    `CREATE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_unique" ON "subscriptions" ("stripe_subscription_id") WHERE "stripe_subscription_id" IS NOT NULL`,
    `CREATE TABLE IF NOT EXISTS "access_requests" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "email" text NOT NULL, "name" text, "product_name" text, "website_url" text, "notes" text, "status" text NOT NULL DEFAULT 'pending', "created_at" timestamptz NOT NULL DEFAULT now())`,
    `CREATE INDEX IF NOT EXISTS "access_requests_email_idx" ON "access_requests" ("email")`,
    `CREATE INDEX IF NOT EXISTS "access_requests_status_created_at_idx" ON "access_requests" ("status", "created_at")`,

    // 0007: usage counter period type — ENUM additions
    `ALTER TYPE "render_status" ADD VALUE IF NOT EXISTS 'abandoned'`,
    `ALTER TABLE "usage_counters" ADD COLUMN IF NOT EXISTS "period_type" text NOT NULL DEFAULT 'weekly'`,
    `ALTER TABLE "usage_counters" ADD COLUMN IF NOT EXISTS "ai_iterations_used" integer NOT NULL DEFAULT 0`,
    `DROP INDEX IF EXISTS "usage_counters_user_project_period_unique"`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "usage_counters_user_project_period_unique" ON "usage_counters" ("user_id", "project_id", "period_start", "period_end")`,

    // 0008: Lemon Squeezy billing
    `ALTER TYPE "subscription_status" ADD VALUE IF NOT EXISTS 'paused'`,
    `ALTER TYPE "subscription_status" ADD VALUE IF NOT EXISTS 'expired'`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lemon_squeezy_customer_id" text`,
    `CREATE INDEX IF NOT EXISTS "users_lemon_squeezy_customer_id_idx" ON "users" ("lemon_squeezy_customer_id")`,
    `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lemon_squeezy_subscription_id" text`,
    `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lemon_squeezy_customer_id" text`,
    `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lemon_squeezy_order_id" text`,
    `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lemon_squeezy_product_id" text`,
    `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lemon_squeezy_variant_id" text`,
    `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "management_url" text`,
    `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "update_payment_method_url" text`,
    `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "provider_status" text`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_lemon_squeezy_subscription_id_unique" ON "subscriptions" ("lemon_squeezy_subscription_id") WHERE "lemon_squeezy_subscription_id" IS NOT NULL`,

    // 0009: connected channels
    `ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "instagram_media_id" text`,
    `ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "platform_post_id" text`,
    `ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "platform_permalink" text`,
    `ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "posted_at" timestamptz`,
    `ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "instagram_insights_json" jsonb`,

    // 0010: project business profile
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "business_profile_json" jsonb`,

    // 0011: channel aware generation
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "channel_id" uuid`,
    `ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "channel_id" uuid`,

    // 0012: content item target channel
    `ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "target_channel" text`,

    // 0013: content item publish strategy
    `ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "publish_strategy" text NOT NULL DEFAULT 'asap'`,

    // 0014: manual publish queue status
    `ALTER TYPE "publish_status" ADD VALUE IF NOT EXISTS 'queued_for_manual_publish'`,

    // 0015: chat first workspace
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "workspace_config_json" jsonb`,

    // 0016: credit ledger
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "beta_tokens" integer NOT NULL DEFAULT 10`,

    // Skip 0017 (two files — project_memory_snapshots, business_context_engine)
    `CREATE TABLE IF NOT EXISTS "project_memory_snapshots" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "project_id" uuid NOT NULL, "snapshot_type" text NOT NULL, "snapshot_json" jsonb NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS "business_context" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "project_id" uuid NOT NULL, "context_json" jsonb NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now())`,

    // 0018: API keys
    `CREATE TABLE IF NOT EXISTS "api_keys" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "label" text NOT NULL, "key_prefix" text NOT NULL, "key_hash" text NOT NULL UNIQUE, "scopes_json" jsonb NOT NULL DEFAULT '[]'::jsonb, "status" text NOT NULL DEFAULT 'active', "last_used_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now())`,

    // 0019: idempotency keys
    `CREATE TABLE IF NOT EXISTS "idempotency_keys" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "idempotency_key" text NOT NULL, "response_json" jsonb NOT NULL, "status_code" integer NOT NULL, "expires_at" timestamptz NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now())`,

    // 0020: usage events
    `CREATE TABLE IF NOT EXISTS "usage_events" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "event_type" text NOT NULL, "metadata_json" jsonb, "created_at" timestamptz NOT NULL DEFAULT now())`,

    // 0021: rate limit counters
    `CREATE TABLE IF NOT EXISTS "rate_limit_counters" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "identifier" text NOT NULL, "window_start" timestamptz NOT NULL, "counter" integer NOT NULL DEFAULT 0, "created_at" timestamptz NOT NULL DEFAULT now())`,

    // 0022: credit pack purchase reason
    `ALTER TYPE "credit_reason" ADD VALUE IF NOT EXISTS 'purchase'`,

    // Credit accounts (billing)
    `CREATE TABLE IF NOT EXISTS "credit_accounts" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "generation_balance" integer NOT NULL DEFAULT 0, "render_balance" integer NOT NULL DEFAULT 0, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now())`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "credit_accounts_user_id_unique" ON "credit_accounts" ("user_id")`,

    // Credit ledger entries (billing)
    `CREATE TABLE IF NOT EXISTS "credit_ledger_entries" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "credit_account_id" uuid NOT NULL, "bucket" text NOT NULL, "direction" text NOT NULL, "reason" text NOT NULL, "amount_delta" integer NOT NULL, "balance_after" integer NOT NULL, "reference_type" text, "reference_id" text, "metadata_json" jsonb NOT NULL DEFAULT '{}'::jsonb, "created_at" timestamptz NOT NULL DEFAULT now())`,
    `CREATE INDEX IF NOT EXISTS "credit_ledger_entries_user_id_idx" ON "credit_ledger_entries" ("user_id")`,
    `CREATE INDEX IF NOT EXISTS "credit_ledger_entries_credit_account_id_idx" ON "credit_ledger_entries" ("credit_account_id")`,
    `CREATE INDEX IF NOT EXISTS "credit_ledger_entries_user_created_at_idx" ON "credit_ledger_entries" ("user_id", "created_at")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "credit_ledger_entries_user_reference_unique" ON "credit_ledger_entries" ("user_id", "reference_type", "reference_id")`,
  ];

  for (const sql of fixes) {
    try {
      await pool.query(sql);
    } catch (err) {
      // ENUM ADD VALUE can fail if value already exists in a transaction
      // ALTER TYPE ... ADD VALUE IF NOT EXISTS should handle this, but just in case
      if (err.message && err.message.includes("already exists")) {
        console.log(`[db-fix] Skipping (already applied): ${sql.slice(0, 80)}...`);
      } else {
        console.error(`[db-fix] Error on: ${sql.slice(0, 80)}...`);
        console.error(`[db-fix] ${err.message}`);
        // Don't exit — try remaining fixes
      }
    }
  }

  console.log("[db-fix] Schema sync complete.");
  await pool.end();
}

run().catch((err) => {
  console.error("[db-fix] Fatal:", err.message);
  process.exit(1);
});
