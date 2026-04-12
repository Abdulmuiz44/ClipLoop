DO $$ BEGIN
  CREATE TYPE "job_status" AS ENUM ('pending', 'running', 'completed', 'failed', 'dead');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "job_type" AS ENUM (
    'publish_content_item',
    'generate_weekly_strategy',
    'generate_weekly_posts',
    'render_content_item',
    'fetch_platform_metrics',
    'compute_performance_rollup',
    'generate_iteration_cycle'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "approved_at" timestamptz;
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "scheduled_for" timestamptz;
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "published_at" timestamptz;
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "external_post_id" text;
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "external_post_url" text;

CREATE INDEX IF NOT EXISTS "content_items_scheduled_for_idx" ON "content_items" ("scheduled_for");
CREATE INDEX IF NOT EXISTS "content_items_publish_status_idx" ON "content_items" ("publish_status");

CREATE TABLE IF NOT EXISTS "job_queue" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" "job_type" NOT NULL,
  "payload_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "status" "job_status" NOT NULL DEFAULT 'pending',
  "run_at" timestamptz NOT NULL,
  "attempts" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 3,
  "locked_at" timestamptz,
  "completed_at" timestamptz,
  "last_error" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "job_queue_status_run_at_idx" ON "job_queue" ("status", "run_at");
CREATE INDEX IF NOT EXISTS "job_queue_type_idx" ON "job_queue" ("type");
