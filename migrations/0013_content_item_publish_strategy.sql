DO $$ BEGIN
 CREATE TYPE "content_publish_strategy" AS ENUM('direct_instagram', 'manual_export');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "publish_strategy" "content_publish_strategy" NOT NULL DEFAULT 'direct_instagram';

UPDATE "content_items"
SET "publish_strategy" = CASE
  WHEN "target_channel" IN ('tiktok', 'whatsapp') THEN 'manual_export'::content_publish_strategy
  ELSE 'direct_instagram'::content_publish_strategy
END;
