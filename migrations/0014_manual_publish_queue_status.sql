DO $$ BEGIN
 CREATE TYPE "content_manual_publish_status" AS ENUM('ready_for_export', 'exported', 'posted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "content_items"
ADD COLUMN IF NOT EXISTS "manual_publish_status" "content_manual_publish_status"
NOT NULL DEFAULT 'ready_for_export';

UPDATE "content_items"
SET "manual_publish_status" = CASE
  WHEN "publish_status" = 'published' THEN 'posted'::content_manual_publish_status
  WHEN "publish_strategy" = 'manual_export' AND "render_status" = 'completed' THEN 'ready_for_export'::content_manual_publish_status
  ELSE 'ready_for_export'::content_manual_publish_status
END;
