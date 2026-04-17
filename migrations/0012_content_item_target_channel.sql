ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "target_channel" "project_channel_type" NOT NULL DEFAULT 'instagram';

UPDATE "content_items"
SET "target_channel" = CASE
  WHEN "platform" = 'tiktok' THEN 'tiktok'::project_channel_type
  ELSE 'instagram'::project_channel_type
END
WHERE "target_channel" IS NULL;
