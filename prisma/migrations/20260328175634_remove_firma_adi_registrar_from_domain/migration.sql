/*
  Warnings:

  - You are about to drop the column `firmaAdi` on the `domains` table. All the data in the column will be lost.
  - You are about to drop the column `registrar` on the `domains` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "domains" DROP COLUMN "firmaAdi",
DROP COLUMN "registrar";
