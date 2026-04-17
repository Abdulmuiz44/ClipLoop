DO $$ BEGIN
 CREATE TYPE "conversation_role" AS ENUM('user', 'assistant', 'system');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "conversation_message_kind" AS ENUM('text', 'status', 'result');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "chat_job_status" AS ENUM('queued', 'running', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "projects"
ADD COLUMN IF NOT EXISTS "context_notes" text;

ALTER TABLE "projects"
ADD COLUMN IF NOT EXISTS "context_settings_json" jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS "project_context_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "source_url" text NOT NULL,
  "title" text,
  "content_text" text NOT NULL,
  "content_hash" varchar(64),
  "metadata_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "project_context_documents_project_id_idx" ON "project_context_documents" USING btree ("project_id");
CREATE INDEX IF NOT EXISTS "project_context_documents_source_url_idx" ON "project_context_documents" USING btree ("source_url");
CREATE UNIQUE INDEX IF NOT EXISTS "project_context_documents_project_source_unique" ON "project_context_documents" USING btree ("project_id","source_url");

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE set null,
  "title" text DEFAULT 'New chat' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "conversations_user_id_idx" ON "conversations" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "conversations_project_id_idx" ON "conversations" USING btree ("project_id");

CREATE TABLE IF NOT EXISTS "conversation_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE cascade,
  "role" "conversation_role" NOT NULL,
  "kind" "conversation_message_kind" NOT NULL DEFAULT 'text',
  "content" text NOT NULL,
  "metadata_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "conversation_messages_conversation_id_idx" ON "conversation_messages" USING btree ("conversation_id");
CREATE INDEX IF NOT EXISTS "conversation_messages_conversation_created_at_idx" ON "conversation_messages" USING btree ("conversation_id","created_at");

CREATE TABLE IF NOT EXISTS "chat_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE cascade,
  "user_message_id" uuid REFERENCES "conversation_messages"("id") ON DELETE set null,
  "assistant_message_id" uuid REFERENCES "conversation_messages"("id") ON DELETE set null,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE set null,
  "content_item_id" uuid REFERENCES "content_items"("id") ON DELETE set null,
  "target_channel" "project_channel_type",
  "status" "chat_job_status" NOT NULL DEFAULT 'queued',
  "request_text" text NOT NULL,
  "error_text" text,
  "metadata_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "chat_jobs_conversation_id_idx" ON "chat_jobs" USING btree ("conversation_id");
CREATE INDEX IF NOT EXISTS "chat_jobs_content_item_id_idx" ON "chat_jobs" USING btree ("content_item_id");
CREATE INDEX IF NOT EXISTS "chat_jobs_status_idx" ON "chat_jobs" USING btree ("status");
