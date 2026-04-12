DO $$ BEGIN
  CREATE TYPE "subscription_status" AS ENUM ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "access_request_status" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_beta_approved" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "beta_approved_at" timestamptz;
CREATE INDEX IF NOT EXISTS "users_is_beta_approved_idx" ON "users" ("is_beta_approved");

CREATE INDEX IF NOT EXISTS "usage_counters_user_period_idx"
ON "usage_counters" ("user_id", "period_start", "period_end");

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "stripe_subscription_id" text,
  "stripe_price_id" text,
  "status" "subscription_status" NOT NULL DEFAULT 'incomplete',
  "current_period_start" timestamptz,
  "current_period_end" timestamptz,
  "cancel_at_period_end" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "subscriptions_user_id_idx" ON "subscriptions" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_unique"
ON "subscriptions" ("stripe_subscription_id") WHERE "stripe_subscription_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "access_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL,
  "name" text,
  "product_name" text,
  "website_url" text,
  "notes" text,
  "status" "access_request_status" NOT NULL DEFAULT 'pending',
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "access_requests_email_idx" ON "access_requests" ("email");
CREATE INDEX IF NOT EXISTS "access_requests_status_created_at_idx" ON "access_requests" ("status", "created_at");
