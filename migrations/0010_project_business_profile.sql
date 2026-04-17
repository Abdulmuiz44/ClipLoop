DO $$ BEGIN
 CREATE TYPE "project_type" AS ENUM('business', 'creator', 'app');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "project_language_style" AS ENUM('english', 'pidgin', 'mixed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "project_type" "project_type";
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "business_name" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "business_category" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "business_description" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "state" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "target_audience" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "primary_offer" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "price_range" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "tone" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "call_to_action" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "instagram_handle" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "whatsapp_number" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "preferred_channels" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "language_style" "project_language_style";
