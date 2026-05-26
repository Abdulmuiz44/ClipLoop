CREATE TABLE IF NOT EXISTS "rate_limit_counters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "api_key_id" uuid NOT NULL REFERENCES "api_keys"("id") ON DELETE CASCADE,
  "key" text NOT NULL,
  "window_start" timestamp with time zone NOT NULL,
  "count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "rate_limit_counters_api_key_window_unique"
  ON "rate_limit_counters" USING btree ("api_key_id", "key", "window_start");

CREATE INDEX IF NOT EXISTS "rate_limit_counters_api_key_created_at_idx"
  ON "rate_limit_counters" USING btree ("api_key_id", "created_at");
