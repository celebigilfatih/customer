DO $$ BEGIN
  ALTER TYPE "SubscriptionType" ADD VALUE 'DOMAIN';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "SubscriptionType" ADD VALUE 'HOSTING';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE subscriptions ALTER COLUMN "type" TYPE "SubscriptionType"[] USING ARRAY["type"];
