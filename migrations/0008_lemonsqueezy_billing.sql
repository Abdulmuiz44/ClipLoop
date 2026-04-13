ALTER TYPE "subscription_status" ADD VALUE IF NOT EXISTS 'paused';
ALTER TYPE "subscription_status" ADD VALUE IF NOT EXISTS 'expired';

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lemon_squeezy_customer_id" text;
CREATE INDEX IF NOT EXISTS "users_lemon_squeezy_customer_id_idx" ON "users" ("lemon_squeezy_customer_id");

ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lemon_squeezy_subscription_id" text;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lemon_squeezy_customer_id" text;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lemon_squeezy_order_id" text;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lemon_squeezy_product_id" text;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lemon_squeezy_variant_id" text;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "management_url" text;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "update_payment_method_url" text;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "provider_status" text;

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_lemon_squeezy_subscription_id_unique"
ON "subscriptions" ("lemon_squeezy_subscription_id") WHERE "lemon_squeezy_subscription_id" IS NOT NULL;
