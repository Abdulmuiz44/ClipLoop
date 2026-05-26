CREATE TYPE "usage_event_source" AS ENUM ('web', 'public_api');

CREATE TABLE IF NOT EXISTS "usage_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE SET NULL,
  "api_key_id" uuid REFERENCES "api_keys"("id") ON DELETE SET NULL,
  "source" "usage_event_source" NOT NULL DEFAULT 'web',
  "action" text NOT NULL,
  "credits_bucket" text,
  "credits_amount" integer,
  "reference_type" text,
  "reference_id" text,
  "metadata_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "usage_events_user_created_at_idx" ON "usage_events" USING btree ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "usage_events_api_key_id_created_at_idx" ON "usage_events" USING btree ("api_key_id", "created_at");
CREATE INDEX IF NOT EXISTS "usage_events_action_created_at_idx" ON "usage_events" USING btree ("action", "created_at");
