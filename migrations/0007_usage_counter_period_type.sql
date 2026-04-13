DO $$ BEGIN
  CREATE TYPE "usage_period_type" AS ENUM ('week', 'month');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "usage_counters"
ADD COLUMN IF NOT EXISTS "period_type" "usage_period_type";

UPDATE "usage_counters"
SET "period_type" = CASE
  WHEN ("period_end" - "period_start") = 6 THEN 'week'::"usage_period_type"
  ELSE 'month'::"usage_period_type"
END
WHERE "period_type" IS NULL;

ALTER TABLE "usage_counters"
ALTER COLUMN "period_type" SET NOT NULL;

DROP INDEX IF EXISTS "usage_counters_user_project_period_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "usage_counters_user_project_period_unique"
ON "usage_counters" ("user_id", "project_id", "period_type", "period_start", "period_end");

DROP INDEX IF EXISTS "usage_counters_user_period_idx";
CREATE INDEX IF NOT EXISTS "usage_counters_user_period_idx"
ON "usage_counters" ("user_id", "period_type", "period_start", "period_end");
