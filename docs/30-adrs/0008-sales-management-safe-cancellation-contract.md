# ADR 0008: Sales Management And Safe Cancellation Contract

## Status

Accepted

## Context

Direct sale creates the operational source document as `Invoice.type = SALE`. Operators also need to list, inspect, edit limited metadata, and cancel sales after creation.

Financial correctness and auditability require that completed sales are not hard-deleted. Deleting invoices, payments, ledger rows, or stock movements can hide financial history and make customer balances impossible to reconcile.

## Decision

Sales management uses `Invoice` as the sale document. No separate `Sale` model is introduced.

The admin surfaces are:

- `/admin/sales`: sale list and summary.
- `/admin/sales/[id]`: sale detail with invoice items, payments, customer ledger effect, stock movements, operational domain/hosting records, and supplier purchases.
- `/admin/sales/[id]/edit`: limited edit for invoice metadata and linked domain/hosting operational fields.
- `/admin/sales/new`: direct sale creation.

Allowed edits are limited to invoice `dueDate`, invoice `notes`, and linked domain/hosting operational metadata. Customer, line items, amounts, stock effects, supplier purchase amounts, and payments are immutable after sale creation. Corrections to those financial fields require safe cancellation plus a new sale.

Sale cancellation is implemented as a server-side transaction through `POST /api/sales/[id]/cancel`:

1. Set the sale invoice status to `CANCELLED`.
2. Create `INVOICE_CANCELLATION_CREDIT` for the customer account.
3. Mark linked paid customer payments as `CANCELLED`.
4. Create `PAYMENT_CANCELLATION_DEBIT` for each cancelled paid customer payment.
5. For stock-tracked product `OUT` movements, create compensating `IN` movements and increment product stock.
6. Keep domain/hosting records; append an operational cancellation note.
7. Cancel unpaid supplier purchases and create `PURCHASE_CANCELLATION` supplier ledger entries.
8. Reject cancellation with `409` when a linked supplier purchase has already been paid.
9. Rebuild affected customer and supplier running balances.

Calling cancellation again for an already cancelled sale is idempotent and does not create duplicate reversal rows.

## Consequences

- Sale history remains auditable.
- Finance and stock reports can distinguish original activity from reversal activity.
- Operators cannot silently mutate historical revenue or inventory.
- Paid supplier purchases require a separate supplier refund/correction workflow before sale cancellation can be automated.

## Rollback

If cancellation behavior is wrong, disable the cancellation UI/action first. Preserve the invoice ID, payment IDs, stock movement IDs, customer account transaction IDs, and supplier purchase/transaction IDs before creating a corrective forward migration or controlled reconciliation script.
