DO $$ BEGIN
 CREATE TYPE "project_channel_type" AS ENUM('instagram', 'tiktok', 'whatsapp');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "preferred_channels_json" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "channel_captions_json" jsonb;
ALTER TABLE "content_items" ADD COLUMN IF NOT EXISTS "channel_cta_text_json" jsonb;

UPDATE "projects"
SET "preferred_channels_json" = to_jsonb(array_remove(ARRAY[
  CASE WHEN lower(coalesce("preferred_channels", '')) LIKE '%instagram%' THEN 'instagram' END,
  CASE WHEN lower(coalesce("preferred_channels", '')) LIKE '%tiktok%' OR lower(coalesce("preferred_channels", '')) LIKE '%tik tok%' THEN 'tiktok' END,
  CASE WHEN lower(coalesce("preferred_channels", '')) LIKE '%whatsapp%' OR lower(coalesce("preferred_channels", '')) LIKE '%whats app%' THEN 'whatsapp' END
], NULL))
WHERE coalesce("preferred_channels", '') <> '';

UPDATE "projects"
SET "preferred_channels_json" = '["instagram"]'::jsonb
WHERE "preferred_channels_json" = '[]'::jsonb;
