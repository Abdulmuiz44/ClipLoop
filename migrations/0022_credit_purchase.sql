DO $$ BEGIN
 ALTER TYPE "credit_reason" ADD VALUE IF NOT EXISTS 'purchase';
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
