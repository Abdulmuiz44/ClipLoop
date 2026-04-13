CREATE TABLE IF NOT EXISTS "connected_channels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "platform" "platform_type" NOT NULL DEFAULT 'instagram',
  "account_name" text,
  "account_id" text,
  "access_token_encrypted" text,
  "refresh_token_encrypted" text,
  "token_expires_at" timestamptz,
  "metadata_json" jsonb,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "connected_channels_project_id_idx" ON "connected_channels" ("project_id");
CREATE INDEX IF NOT EXISTS "connected_channels_project_platform_idx" ON "connected_channels" ("project_id", "platform");
CREATE INDEX IF NOT EXISTS "connected_channels_is_active_idx" ON "connected_channels" ("is_active");
CREATE INDEX IF NOT EXISTS "connected_channels_account_id_idx" ON "connected_channels" ("account_id");
