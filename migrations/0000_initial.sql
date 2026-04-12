CREATE TYPE "plan_type" AS ENUM ('free', 'starter', 'beta');
CREATE TYPE "project_goal_type" AS ENUM ('clicks', 'signups', 'revenue');
CREATE TYPE "strategy_cycle_source" AS ENUM ('initial', 'iteration', 'manual_regeneration');
CREATE TYPE "render_status" AS ENUM ('pending', 'queued', 'rendering', 'completed', 'failed');
CREATE TYPE "publish_status" AS ENUM ('draft', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'skipped');
CREATE TYPE "platform_type" AS ENUM ('instagram', 'tiktok');
CREATE TYPE "content_type" AS ENUM ('slideshow_video');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL,
  "full_name" text,
  "plan" "plan_type" NOT NULL DEFAULT 'free',
  "billing_status" text,
  "stripe_customer_id" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email");
CREATE INDEX "users_stripe_customer_id_idx" ON "users" ("stripe_customer_id");

CREATE TABLE "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "product_name" text NOT NULL,
  "one_liner" text,
  "description" text NOT NULL,
  "audience" text NOT NULL,
  "niche" text NOT NULL,
  "offer" text NOT NULL,
  "website_url" text,
  "cta_url" text NOT NULL,
  "goal_type" "project_goal_type" NOT NULL,
  "voice_prefs_json" jsonb,
  "example_posts_json" jsonb,
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "projects_user_id_idx" ON "projects" ("user_id");

CREATE TABLE "strategy_cycles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "week_start" date NOT NULL,
  "week_end" date,
  "source" "strategy_cycle_source" NOT NULL DEFAULT 'initial',
  "strategy_summary" text,
  "angles_json" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "llm_provider" text,
  "llm_model" text,
  "prompt_version" varchar(50),
  "status" text NOT NULL DEFAULT 'ready',
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "strategy_cycles_project_id_idx" ON "strategy_cycles" ("project_id");
CREATE UNIQUE INDEX "strategy_cycles_project_week_unique" ON "strategy_cycles" ("project_id", "week_start");

CREATE TABLE "content_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "strategy_cycle_id" uuid NOT NULL REFERENCES "strategy_cycles"("id") ON DELETE CASCADE,
  "parent_content_item_id" uuid REFERENCES "content_items"("id") ON DELETE SET NULL,
  "platform" "platform_type" NOT NULL DEFAULT 'instagram',
  "content_type" "content_type" NOT NULL DEFAULT 'slideshow_video',
  "internal_title" text NOT NULL,
  "angle" text NOT NULL,
  "hook" text NOT NULL,
  "slides_json" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "caption" text NOT NULL,
  "hashtags_json" jsonb,
  "cta_text" text NOT NULL,
  "destination_url" text NOT NULL,
  "tracking_slug" varchar(255) NOT NULL,
  "template_id" text NOT NULL DEFAULT 'simple-v1',
  "render_status" "render_status" NOT NULL DEFAULT 'pending',
  "publish_status" "publish_status" NOT NULL DEFAULT 'draft',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "content_items_strategy_cycle_id_idx" ON "content_items" ("strategy_cycle_id");
CREATE UNIQUE INDEX "content_items_tracking_slug_unique" ON "content_items" ("tracking_slug");
CREATE INDEX "content_items_parent_content_item_id_idx" ON "content_items" ("parent_content_item_id");

CREATE TABLE "usage_counters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE CASCADE,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "posts_generated" integer NOT NULL DEFAULT 0,
  "manual_regenerations" integer NOT NULL DEFAULT 0,
  "videos_rendered" integer NOT NULL DEFAULT 0,
  "posts_published" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "usage_counters_user_project_period_unique" ON "usage_counters" ("user_id", "project_id", "period_start", "period_end");
