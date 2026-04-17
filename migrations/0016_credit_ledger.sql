DO $$ BEGIN
 CREATE TYPE "credit_bucket" AS ENUM('generation', 'render');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "credit_direction" AS ENUM('credit', 'debit');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "credit_reason" AS ENUM(
  'monthly_grant',
  'action_generate_copy',
  'action_generate_video_generation',
  'action_generate_video_render',
  'manual_adjustment'
 );
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "credit_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "generation_balance" integer NOT NULL DEFAULT 0,
  "render_balance" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "credit_accounts_user_id_unique" ON "credit_accounts" USING btree ("user_id");

CREATE TABLE IF NOT EXISTS "credit_ledger_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "credit_account_id" uuid NOT NULL REFERENCES "credit_accounts"("id") ON DELETE cascade,
  "bucket" "credit_bucket" NOT NULL,
  "direction" "credit_direction" NOT NULL,
  "reason" "credit_reason" NOT NULL,
  "amount_delta" integer NOT NULL,
  "balance_after" integer NOT NULL,
  "reference_type" text,
  "reference_id" text,
  "metadata_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "credit_ledger_entries_user_id_idx" ON "credit_ledger_entries" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "credit_ledger_entries_credit_account_id_idx" ON "credit_ledger_entries" USING btree ("credit_account_id");
CREATE INDEX IF NOT EXISTS "credit_ledger_entries_user_created_at_idx" ON "credit_ledger_entries" USING btree ("user_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "credit_ledger_entries_user_reference_unique"
  ON "credit_ledger_entries" USING btree ("user_id", "reference_type", "reference_id")
  WHERE "reference_type" is not null and "reference_id" is not null;
