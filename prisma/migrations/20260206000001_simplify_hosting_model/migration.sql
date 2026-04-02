-- Add name column with default value first
ALTER TABLE "hosting" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';

-- Drop old columns
ALTER TABLE "hosting" DROP COLUMN IF EXISTS "package";
ALTER TABLE "hosting" DROP COLUMN IF EXISTS "server";
ALTER TABLE "hosting" DROP COLUMN IF EXISTS "ip";
ALTER TABLE "hosting" DROP COLUMN IF EXISTS "panelUrl";
ALTER TABLE "hosting" DROP COLUMN IF EXISTS "panelUser";
ALTER TABLE "hosting" DROP COLUMN IF EXISTS "panelPass";

-- Remove default after adding
ALTER TABLE "hosting" ALTER COLUMN "name" DROP DEFAULT;
