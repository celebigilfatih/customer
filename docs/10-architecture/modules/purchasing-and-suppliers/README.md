# Purchasing And Suppliers Module

## Ownership

Purchasing And Suppliers owns supplier-side financial truth:

- Supplier cards
- Supplier purchases
- Supplier payments
- Supplier account transactions
- Supplier running balances
- Supplier payable audit trail

## Boundaries

This module owns payable ledger correctness for suppliers. Customer receivables remain owned by Accounting And Finance. Sale intent and sale invoice creation remain owned by Proposals And Sales through the direct-sale server-side contract.

Domain And Hosting Operations owns operational domain/hosting lifecycle records. Direct sale may create those records only through the documented server-side transaction.

Products And Stock owns stock-tracked product quantity and stock movements. Domain/hosting and other on-demand catalog services are `SERVICE` entries and must not create stock movements.

## Current Server-Side Contracts

- `/api/suppliers`
  - `GET`: `ADMIN` or `SUPPORT` only.
  - `POST`: `ADMIN` or `SUPPORT` only.
  - Creates supplier cards used by direct sale purchase lines.

- `/api/suppliers/[id]`
  - `GET`: `ADMIN` or `SUPPORT` only.
  - `PUT`: `ADMIN` or `SUPPORT` only.
  - `DELETE`: `ADMIN` or `SUPPORT` only; soft-deactivates the supplier.

- `/api/suppliers/[id]/payments`
  - `POST`: `ADMIN` or `SUPPORT` only.
  - V1 closes an unpaid supplier purchase with one full payment.
  - Creates `SUPPLIER_PAYMENT` and marks the purchase `PAID` in one transaction.

- `/api/sales/direct`
  - May create `SupplierPurchase` rows per sale line.
  - Creates `PURCHASE_DEBT` for every supplier purchase.
  - If the purchase is already paid, creates `SupplierPayment` and `SUPPLIER_PAYMENT` in the same transaction.
  - May create Domain or Hosting operational records for domain/hosting catalog service lines.
  - Must not create stock movements for `SERVICE` lines.

## Supplier Running Balance Rule

Supplier balance means "amount we owe to this supplier".

```text
newBalance = previousBalance + credit - debit
```

- `PURCHASE_DEBT`: `credit = purchase.total`, balance increases.
- `SUPPLIER_PAYMENT`: `debit = payment.amount`, balance decreases.

Use `src/lib/supplier-ledger.ts` for supplier ledger mutations and rebuilds. Do not hand-write supplier transaction balances in route handlers.

## Operational Risks

- Creating supplier purchases outside the direct-sale transaction can leave customer sale and supplier payable records out of sync.
- Treating domain/hosting services as stock-tracked products creates fake inventory and blocks demand-driven purchasing.
- Partial supplier payments are not modeled in V1; the payment endpoint intentionally requires full purchase closure.
- Retrying direct sale without `idempotencyKey` can duplicate both customer receivable and supplier payable records.

## Rollback Strategy

- Disable the direct-sale action before reconciling duplicate supplier payable records.
- Search by `invoices.idempotencyKey` first; then compare invoice items, supplier purchases, supplier transactions, domain/hosting records, and stock movements as one unit.
- For a duplicated unpaid supplier purchase, preserve IDs before deleting or reversing records.
- For a supplier payment error, verify `SupplierPayment`, `SUPPLIER_PAYMENT`, and the related `SupplierPurchase.status` together.
