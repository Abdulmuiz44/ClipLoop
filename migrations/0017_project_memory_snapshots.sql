CREATE TABLE IF NOT EXISTS "project_memory_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "version" integer NOT NULL DEFAULT 1,
  "snapshot_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "source" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "pms_project_id_idx"
  ON "project_memory_snapshots" USING btree ("project_id");

CREATE INDEX IF NOT EXISTS "pms_project_version_idx"
  ON "project_memory_snapshots" USING btree ("project_id", "version");
