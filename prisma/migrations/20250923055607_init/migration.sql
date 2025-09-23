-- CreateEnum
CREATE TYPE "public"."CustomerStatus" AS ENUM ('POTENTIAL', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "club" TEXT NOT NULL,
    "sportsSchoolOfficial" TEXT NOT NULL,
    "hosting" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "offer" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "status" "public"."CustomerStatus" NOT NULL DEFAULT 'POTENTIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notes" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."notes" ADD CONSTRAINT "notes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
