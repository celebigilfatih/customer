/*
  Warnings:

  - The values [STAGE_3,STAGE_4,FINAL] on the enum `Stage` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `email` on the `team_applications` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Stage_new" AS ENUM ('STAGE_1', 'STAGE_2');
ALTER TABLE "team_applications" ALTER COLUMN "stage" TYPE "Stage_new" USING ("stage"::text::"Stage_new");
ALTER TABLE "teams" ALTER COLUMN "stage" TYPE "Stage_new" USING ("stage"::text::"Stage_new");
ALTER TABLE "settings" ALTER COLUMN "availableStages" TYPE "Stage_new"[] USING ("availableStages"::text::"Stage_new"[]);
ALTER TYPE "Stage" RENAME TO "Stage_old";
ALTER TYPE "Stage_new" RENAME TO "Stage";
DROP TYPE "public"."Stage_old";
COMMIT;

-- AlterTable
ALTER TABLE "team_applications" DROP COLUMN "email",
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "twitter" TEXT,
ADD COLUMN     "website" TEXT;
