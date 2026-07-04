UPDATE "customers" AS "customer"
SET "status" = 'ACTIVE'
WHERE "customer"."status" = 'POTENTIAL'
  AND EXISTS (
    SELECT 1
    FROM "invoices" AS "invoice"
    WHERE "invoice"."customerId" = "customer"."id"
      AND "invoice"."type" = 'SALE'
      AND "invoice"."status" <> 'CANCELLED'
  );
