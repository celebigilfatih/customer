-- CreateTable
CREATE TABLE IF NOT EXISTS "webhook_logs" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "statusCode" INTEGER,
    "error" TEXT,
    "attempt" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "webhook_queue" (
    "id" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "secret" TEXT,
    "attempt" INTEGER NOT NULL,
    "nextAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_queue_pkey" PRIMARY KEY ("id")
);

-- Existing development databases may already have early webhook tables.
-- Bring those tables up to the durable contract without deleting data.
ALTER TABLE "webhook_logs" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "webhook_queue" ADD COLUMN IF NOT EXISTS "dedupeKey" TEXT;
UPDATE "webhook_queue" SET "dedupeKey" = "id" WHERE "dedupeKey" IS NULL;
ALTER TABLE "webhook_queue" ALTER COLUMN "dedupeKey" SET NOT NULL;

ALTER TABLE "webhook_queue" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "webhook_queue" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
UPDATE "webhook_queue" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "webhook_queue" ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "webhook_logs_timestamp_idx" ON "webhook_logs"("timestamp");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "webhook_logs_event_ok_idx" ON "webhook_logs"("event", "ok");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_queue_dedupeKey_key" ON "webhook_queue"("dedupeKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "webhook_queue_nextAt_idx" ON "webhook_queue"("nextAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "webhook_queue_event_idx" ON "webhook_queue"("event");
