DO $$ BEGIN
  CREATE TYPE "experiment_mutation_type" AS ENUM ('hook', 'cta', 'angle', 'structure');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "iteration_status" AS ENUM ('draft', 'generated', 'applied', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "iteration_experiments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "strategy_cycle_id" uuid REFERENCES "strategy_cycles"("id") ON DELETE SET NULL,
  "winner_content_item_id" uuid REFERENCES "content_items"("id") ON DELETE SET NULL,
  "hypothesis" text,
  "mutation_type" "experiment_mutation_type" NOT NULL,
  "input_summary" text,
  "result_summary" text,
  "status" "iteration_status" NOT NULL DEFAULT 'draft',
  "metadata_json" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "iteration_experiments_project_id_idx" ON "iteration_experiments" ("project_id");
CREATE INDEX IF NOT EXISTS "iteration_experiments_winner_content_item_id_idx" ON "iteration_experiments" ("winner_content_item_id");
CREATE INDEX IF NOT EXISTS "iteration_experiments_mutation_type_idx" ON "iteration_experiments" ("mutation_type");
