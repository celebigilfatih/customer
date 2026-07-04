# ADR 0003: Direct Sale Server-Side Contract

Date: 2026-07-02

## Status

Accepted

## Context

The application needed a direct-sale flow that is independent from proposals: select a customer, add products or services, complete the sale, and optionally collect payment.

Before this decision, the sales path was ambiguous:

- Proposal approval could be treated as a financial event.
- Direct sales had no dedicated operator surface.
- Creating a sale through multiple client-side requests could leave partial invoices, payments, ledger rows, or stock movements.
- Retrying a sale request could duplicate customer debt and stock deductions.

Financial correctness has priority over feature count. Sale completion must therefore be one server-side contract with explicit accounting and stock side effects.

## Decision

Direct sale is implemented through:

- UI: `/admin/sales/new`
- API: `POST /api/sales/direct`
- Accounting document: `Invoice` with `type = SALE`
- Idempotency field: `Invoice.idempotencyKey`

`POST /api/sales/direct` requires `ADMIN` or `SUPPORT`. The browser sends intent only: customer, lines, tax rate, due date, notes, payment mode, optional collected amount, and `idempotencyKey`.

The server is authoritative for totals and performs the sale inside one database transaction:

1. Check authorization.
2. Return the existing invoice result if `idempotencyKey` was already used.
3. Validate customer and active products.
4. Calculate subtotal, tax, total, paid amount, and remaining amount.
5. Create a `SALE` invoice with final status:
   - `CREDIT`: `ISSUED`
   - `PARTIAL`: `PARTIAL`
   - `PAID`: `PAID`
6. Activate the customer when its lifecycle status is still `POTENTIAL`.
7. Create `INVOICE_DEBT` through the accounting ledger helper.
8. Decrement stock-tracked product stock with an atomic stock-quantity check.
9. Create `OUT` stock movements for stock-tracked product lines.
10. If payment was collected, create one `PAID` payment linked to the invoice and synchronize one `PAYMENT_CREDIT`.

If any stock check fails, the transaction rolls back. No invoice, payment, account transaction, or stock movement is committed.

ADR 0004 clarifies that catalog `SERVICE` lines are invoice-linked catalog lines but are not stock-tracked.

Payment credits created for invoice-linked payments also carry the invoice ID for audit traceability.

Proposal approval is not a financial event. `/api/proposals/[id]/approve` now changes proposal status to `APPROVED` only. Customer debt and stock movement are created only by invoice issuance or direct sale.

## Consequences

- Operators have a single direct-sale entry point instead of stitching invoices, stock, and payments together manually.
- A customer with a successful sale is no longer treated as a potential customer unless an operator later deliberately changes its lifecycle status.
- Client components must not create secondary financial records for direct-sale completion.
- Retrying the same direct-sale request with the same `idempotencyKey` is safe.
- Proposal approval no longer reserves stock or creates customer receivables.
- Legacy `PROPOSAL_DEBT` records, if any exist, are not automatically migrated by this ADR.
- Returns, cancellations, and corrective sales are out of scope for direct-sale v1 and require a separate ADR/runbook update.

## Operational Invariants

- A direct-sale invoice must have exactly one `INVOICE_DEBT`.
- A paid or partially paid direct-sale invoice must have exactly one linked `PAID` payment for the collected amount.
- A linked paid payment must have exactly one `PAYMENT_CREDIT`.
- Stock-tracked `PRODUCT` direct-sale lines must have committed stock movements only when the invoice transaction commits.
- Customer running balance must equal `sum(debit) - sum(credit)` after direct sale.
- A successful direct sale may transition customer status from `POTENTIAL` to `ACTIVE`; it must not silently reopen `INACTIVE` or `LOST` customers.

## Rollback

If this contract introduces an incident:

1. Disable `/admin/sales/new` or block `POST /api/sales/direct`.
2. Preserve affected invoice, payment, account transaction, stock movement, and `idempotencyKey` values.
3. Revert the deployment only after preserving those IDs.
4. Reconcile customer balances and product stock from the preserved records.
5. Rebuild affected customer running balances through the accounting ledger helper.
6. Record manual corrections in the changelog or an incident note.
