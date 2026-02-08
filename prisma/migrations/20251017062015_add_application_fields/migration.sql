/*
  Warnings:

  - Added the required column `email` to the `team_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stage` to the `team_applications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "team_applications" ADD COLUMN     "ageGroups" "AgeGroup"[],
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "stage" "Stage" NOT NULL;
