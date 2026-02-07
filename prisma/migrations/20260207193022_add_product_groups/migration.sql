-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "groupId" TEXT;

-- CreateTable
CREATE TABLE "public"."product_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_groups_name_key" ON "public"."product_groups"("name");

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."product_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
