CREATE TABLE IF NOT EXISTS "idempotency_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "api_key_id" uuid REFERENCES "api_keys"("id") ON DELETE SET NULL,
  "key" text NOT NULL,
  "request_hash" text NOT NULL,
  "method" text NOT NULL,
  "path" text NOT NULL,
  "status" text NOT NULL DEFAULT 'in_progress',
  "response_status" integer,
  "response_json" jsonb,
  "reference_type" text NOT NULL DEFAULT 'idempotency',
  "reference_id" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idempotency_keys_user_path_key_unique" ON "idempotency_keys" USING btree ("user_id", "path", "key");
CREATE INDEX IF NOT EXISTS "idempotency_keys_expires_at_idx" ON "idempotency_keys" USING btree ("expires_at");
CREATE INDEX IF NOT EXISTS "idempotency_keys_api_key_id_created_at_idx" ON "idempotency_keys" USING btree ("api_key_id", "created_at");
