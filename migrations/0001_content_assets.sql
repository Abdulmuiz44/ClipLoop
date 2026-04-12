CREATE TYPE "asset_type" AS ENUM ('video', 'thumbnail');

CREATE TABLE "content_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "content_item_id" uuid NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
  "asset_type" "asset_type" NOT NULL,
  "storage_url" text NOT NULL,
  "storage_path" text,
  "duration_sec" integer,
  "width" integer,
  "height" integer,
  "metadata_json" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "content_assets_content_item_id_idx" ON "content_assets" ("content_item_id");
CREATE INDEX "content_assets_content_item_asset_type_idx" ON "content_assets" ("content_item_id", "asset_type");
CREATE UNIQUE INDEX "content_assets_content_item_asset_type_unique" ON "content_assets" ("content_item_id", "asset_type");
