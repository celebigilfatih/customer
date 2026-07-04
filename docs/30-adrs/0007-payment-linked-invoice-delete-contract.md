# ADR 0007: Payment-Linked Invoice Delete Contract

Date: 2026-07-04

## Status

Accepted

## Context

Operators manage collected payments from `/admin/finance`. For direct-sale flows, a paid sale creates both a `Payment` and a linked `Invoice`. Deleting only the payment left the invoice debt, invoice row, and possible invoice stock movements in place, which made the payment list and accounting state hard to understand for simple mistaken-entry cleanup.

Full returns, cancellations, and corrective sales remain broader workflows. This decision covers only the narrow delete behavior for a payment that is linked to a single-payment invoice.

## Decision

Deleting a payment through `DELETE /api/payments?id=...` now behaves as follows:

- If the payment is not linked to an invoice, delete the payment's account transaction, delete the payment, and rebuild the customer running balance.
- If the payment is linked to an invoice with exactly one payment:
  - delete account transactions linked to the payment or invoice
  - reverse linked invoice `OUT` stock movements by incrementing product stock
  - delete linked stock movement rows
  - delete the payment
  - delete the invoice
  - rebuild the customer running balance
- If the invoice has multiple payments, refuse automatic invoice deletion with `409`.
- If the invoice has stock movements that are not safely reversible `OUT` movements, refuse automatic invoice deletion with `409`.

The delete operation is one database transaction. Partial deletion must not commit.

## Consequences

- Simple mistaken paid direct-sale entries can be removed from the finance screen without leaving orphan invoice debt.
- Stock-tracked product quantities are restored when the linked invoice is deleted.
- Multi-payment invoices still require a deliberate correction workflow.
- Domain, hosting, and supplier purchase records linked through nullable invoice references may remain as operational/payable records and must be reconciled separately when needed.
- This is not a general return, cancellation, credit-note, or refund workflow.

## Rollback

If this contract causes an incident:

1. Disable payment deletion from `/admin/finance`.
2. Preserve the affected payment, invoice, account transaction, stock movement, and product IDs.
3. Restore from backup or recreate the deleted invoice/payment records only after reconciling against external payment evidence.
4. Rebuild the affected customer running balance.
5. Reconcile product stock from stock movement history and physical/operational evidence.
