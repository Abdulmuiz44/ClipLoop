DO $$ BEGIN
  CREATE TYPE "event_type" AS ENUM ('signup', 'trial_started', 'purchase');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "revenue_source" AS ENUM ('stripe', 'revenuecat', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "click_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "content_item_id" uuid NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
  "tracking_slug" varchar(255) NOT NULL,
  "click_id" varchar(255) NOT NULL,
  "referrer" text,
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "ip_hash" text,
  "user_agent" text,
  "country_code" varchar(3),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "click_events_click_id_unique" ON "click_events" ("click_id");
CREATE INDEX IF NOT EXISTS "click_events_content_item_id_idx" ON "click_events" ("content_item_id");
CREATE INDEX IF NOT EXISTS "click_events_created_at_idx" ON "click_events" ("created_at");

CREATE TABLE IF NOT EXISTS "conversion_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "content_item_id" uuid REFERENCES "content_items"("id") ON DELETE SET NULL,
  "click_id" varchar(255),
  "event_type" "event_type" NOT NULL,
  "external_user_id" text,
  "value" integer,
  "currency" varchar(10),
  "metadata_json" jsonb,
  "occurred_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "conversion_events_click_id_idx" ON "conversion_events" ("click_id");

CREATE TABLE IF NOT EXISTS "revenue_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "content_item_id" uuid REFERENCES "content_items"("id") ON DELETE SET NULL,
  "click_id" varchar(255),
  "source" "revenue_source" NOT NULL,
  "external_event_id" text,
  "customer_id" text,
  "amount" integer NOT NULL,
  "currency" varchar(10) NOT NULL,
  "event_name" text,
  "metadata_json" jsonb,
  "occurred_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "revenue_events_click_id_idx" ON "revenue_events" ("click_id");
CREATE UNIQUE INDEX IF NOT EXISTS "revenue_events_source_external_event_id_unique"
ON "revenue_events" ("source", "external_event_id") WHERE "external_event_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "performance_metrics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "content_item_id" uuid NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
  "views" integer NOT NULL DEFAULT 0,
  "clicks" integer NOT NULL DEFAULT 0,
  "signups" integer NOT NULL DEFAULT 0,
  "revenue" integer NOT NULL DEFAULT 0,
  "ctr" integer NOT NULL DEFAULT 0,
  "epc" integer NOT NULL DEFAULT 0,
  "score" integer NOT NULL DEFAULT 0,
  "classification" text,
  "last_calculated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "performance_metrics_content_item_id_unique" ON "performance_metrics" ("content_item_id");
CREATE INDEX IF NOT EXISTS "performance_metrics_project_id_idx" ON "performance_metrics" ("project_id");
CREATE INDEX IF NOT EXISTS "performance_metrics_score_idx" ON "performance_metrics" ("score");
