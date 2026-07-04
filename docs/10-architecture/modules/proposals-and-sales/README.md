# Proposals And Sales Module

## Ownership

Proposals And Sales owns the sales intent lifecycle:

- Proposal creation and proposal status transitions
- Proposal customer and item selection
- Proposal approval, rejection, send, and PDF flows
- Proposal type settings
- Direct sale operator workflow before the accounting contract is invoked

## Boundaries

Proposals And Sales does not own financial ledger correctness, customer balances, payment reconciliation, or stock ledger correctness.

Accounting And Finance owns invoices, payments, account transactions, and balances. Products And Stock owns product quantity changes and stock movements.

Sales flows may request accounting or stock mutations only through explicit server-side contracts.

## Current Observed State

- `/admin/proposals` is the primary sales intent UI.
- `/admin/proposals/add` can create proposal records with product-backed line items.
- Proposal creation does not mutate customer balances or stock.
- `/api/proposals/[id]/approve` changes proposal status to `APPROVED` only. It does not create customer debt or stock movements.
- `/api/invoices` can create draft invoices, and `/api/invoices/[id]/issue` can issue an invoice, create `INVOICE_DEBT`, and create stock movements.
- `/admin/invoices` currently lists invoices only; it does not provide a create or issue action.
- `/admin/sales/new` is the direct-sale UI for quote-independent sales.
- `/api/sales/direct` is the server-side direct-sale contract. It creates the sale invoice, customer debt, stock movements for stock-tracked products, and optional payment inside one database transaction.
- Direct sale may also collect line-level supplier purchase information for demand-driven services such as domain and hosting.

## Direct Sale Contract

Direct sale is explicit and server-side. It must not be implemented as separate client-side calls stitched together by the browser.

Operator flow:

1. Select or create the customer.
2. Add product/service lines.
3. Validate stock for stock-tracked `PRODUCT` catalog entries.
4. Create and issue a `SALE` invoice.
5. Create `INVOICE_DEBT` through Accounting And Finance.
6. Create stock movements through Products And Stock only for `PRODUCT` lines.
7. Optionally create a `PAID` payment in the same transaction when payment is collected immediately.
8. For line-level purchases, create supplier purchase debt through Purchasing And Suppliers.
9. For paid supplier purchases, create supplier payment through Purchasing And Suppliers.
10. For domain/hosting catalog service lines, create the related operational record.
11. Rebuild/verify the customer running balance through the accounting ledger helper.

Supported payment modes:

- `CREDIT`: invoice status `ISSUED`; no payment row.
- `PARTIAL`: invoice status `PARTIAL`; one `PAID` payment for the collected amount.
- `PAID`: invoice status `PAID`; one `PAID` payment for the invoice total.

The accepted cross-context mutation order is recorded in ADR 0003.
Catalog service behavior is recorded in ADR 0004.
Supplier purchase behavior is recorded in ADR 0006.

## Non-Responsibilities

Proposals And Sales must not:

- Hand-write account transaction balances.
- Silently create payment credits without an Accounting And Finance contract.
- Deduct stock from client code.
- Treat a proposal approval and an issued invoice as the same financial event.
- Own supplier payable balances; those belong to Purchasing And Suppliers.

## Operational Risks

- Approving a proposal and issuing an invoice for the same sale can duplicate customer debt if both create ledger debit entries.
- Client-side multi-step sale completion can leave partial records when one request fails.
- A payment collected without an issued debt document can make the customer balance negative or hide revenue recognition questions.
- Stock deduction before all financial validation passes can leave inventory incorrect.
- Retrying direct-sale requests without `idempotencyKey` can duplicate invoices and stock movements.
- Treating reusable services as stock-tracked products can create fake inventory or block legitimate service sales.
- Creating supplier purchases outside the direct-sale transaction can leave customer sale and supplier payable records out of sync.

## Rollback Notes

- If a sale flow creates duplicate debt, identify whether the debit came from legacy `PROPOSAL_DEBT`, `INVOICE_DEBT`, or both before correcting records.
- If stock was deducted but accounting failed, compare `stock_movements` to invoice IDs before manual correction.
- Disable the affected sale action before reconciling financial records.
- For direct-sale retries, search `invoices.idempotencyKey` before creating replacement records.
- When line-level purchases exist, compare invoice items, supplier purchases, supplier transactions, and supplier payments as one unit.
