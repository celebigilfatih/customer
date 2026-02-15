-- AlterTable
ALTER TABLE "products" ADD COLUMN     "costPrice" DECIMAL(65,30),
ADD COLUMN     "profitMargin" DECIMAL(65,30) DEFAULT 0;
