-- AlterEnum
ALTER TYPE "public"."CustomerStatus" ADD VALUE 'SOLD';

-- AlterTable
ALTER TABLE "public"."customers" ADD COLUMN     "price" TEXT;
