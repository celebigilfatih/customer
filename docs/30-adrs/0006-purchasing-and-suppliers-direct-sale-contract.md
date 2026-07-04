# ADR 0006: Purchasing And Suppliers Direct Sale Contract

Date: 2026-07-03

## Status

Accepted

## Context

Domain and hosting sales are demand-driven. They are not stock-tracked inventory; the business often buys the service from a supplier and sells it to the customer in the same operator workflow.

The application already has a direct-sale contract that creates a customer sale invoice, customer receivable ledger debt, optional customer payment, and stock movement for stock-tracked products. It did not record supplier-side payable truth or create related domain/hosting operational records from the same sale.

## Decision

Create a new bounded context named Purchasing And Suppliers.

Direct sale may now carry optional line-level purchase data. When present, `/api/sales/direct` creates these records inside the same database transaction as the sale invoice:

- `SupplierPurchase`
- `PURCHASE_DEBT` supplier account transaction
- Optional `SupplierPayment`
- Optional `SUPPLIER_PAYMENT` supplier account transaction
- Domain or Hosting operational record for domain/hosting service lines

Supplier balance represents the amount owed to the supplier:

```text
newBalance = previousBalance + credit - debit
```

Domain/hosting catalog entries remain `SERVICE` products. They must not create stock movements.

## Consequences

- Supplier payables are auditable and linked to the sale invoice item.
- Domain/hosting operational records can be traced back to the sale invoice and invoice item.
- Direct sale remains idempotent through `Invoice.idempotencyKey`; idempotent retries must not duplicate supplier purchases, payments, or operational records.
- V1 supplier payment closure is full-payment only. Partial supplier payments require a later ADR because they change supplier payable status semantics.

## Rollback

- Search the affected invoice by `idempotencyKey`.
- Review invoice items, supplier purchases, supplier transactions, supplier payments, domain/hosting records, and stock movements together.
- If the sale was duplicated, disable the direct-sale action before correcting financial records.
- If supplier payment was recorded incorrectly, preserve the payment and ledger transaction IDs before reversal or deletion.
