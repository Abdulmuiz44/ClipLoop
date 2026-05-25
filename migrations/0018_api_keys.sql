DO $$ BEGIN
 CREATE TYPE "api_key_status" AS ENUM('active', 'revoked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE cascade,
  "label" text NOT NULL,
  "key_prefix" varchar(16) NOT NULL,
  "key_hash" text NOT NULL,
  "scopes_json" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "status" "api_key_status" NOT NULL DEFAULT 'active',
  "revoked_at" timestamp with time zone,
  "last_used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "api_keys_user_status_idx" ON "api_keys" USING btree ("user_id", "status");
CREATE INDEX IF NOT EXISTS "api_keys_project_id_idx" ON "api_keys" USING btree ("project_id");
CREATE INDEX IF NOT EXISTS "api_keys_key_prefix_idx" ON "api_keys" USING btree ("key_prefix");

CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_user_hash_unique" ON "api_keys" USING btree ("user_id", "key_hash");
