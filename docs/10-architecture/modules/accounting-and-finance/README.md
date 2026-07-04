# Accounting And Finance Module

## Ownership

Accounting And Finance owns financial records and financial state:

- Payments
- Invoices
- Account transactions
- Customer balances
- Manual opening-balance adjustments
- Finance/admin payment screens

## Boundaries

This module owns ledger correctness. Other domains may provide source events, but they must not compute customer balances or create hidden financial mutations in client code.

Subscription And Renewal Management may request payment schedule creation through the server-side subscription API contract. The resulting `Payment` rows are due-plan records. They do not create ledger credit until their status is `PAID`.

Products And Stock owns product quantities and stock movements. When invoice issuance affects both stock and accounting, the operation must run inside one database transaction.
Catalog services are non-stock entries; they may appear on invoices, but they must not create stock movements.

Purchasing And Suppliers owns supplier payables. Supplier purchases and supplier payments must not be recorded as customer account transactions.

## Admin UI Surface

Customer receivable details are displayed inside the unified customer detail route:

- `/admin/customers/[id]?tab=accounting`
- `/admin/customers/[id]?tab=transactions`

The standalone accounting customer list is not a primary navigation surface. Legacy accounting customer URLs redirect to the unified customer detail route, while Accounting And Finance remains the owner of the backing balance and transaction APIs.

## Current Server-Side Contracts

- `/api/payments`
  - `GET`: authenticated access. `ADMIN` and `SUPPORT` may read all payments. `CUSTOMER` may read only its own customer payments.
  - `GET` with `summary=true`: returns real tax-excluded payment summary buckets for collected, open, due, late, and current-month collected payments within the authenticated user's allowed payment scope. It also returns collected payment tax totals for the finance summary cards. Invoice-linked payments use the invoice `subtotal / total` ratio; payments without invoice tax detail are returned at their recorded amount and have zero derived tax.
  - `POST`, `PUT`, `DELETE`: `ADMIN` or `SUPPORT` only.
  - A payment with status `PAID` creates or updates one `PAYMENT_CREDIT` account transaction.
  - If the payment is linked to an invoice, the related `PAYMENT_CREDIT` also carries the same `invoiceId` for audit traceability.
  - A payment moved from `PAID` to `DUE` or `LATE` removes the related payment credit and rebuilds the customer's running balances.
  - Deleting a payment removes related payment ledger entries and rebuilds the customer's running balances.

- `/api/accounting/customers`
  - `ADMIN` or `SUPPORT` only.
  - Customer current balance is calculated from account transaction debit and credit totals.

- `/api/accounting/customers/[id]`
  - `ADMIN` or `SUPPORT` only.
  - Returns gross/legal ledger values unchanged through `debit`, `credit`, `balance`, and gross summary totals.
  - Also returns tax-excluded display values through `taxExcludedDebit`, `taxExcludedCredit`, `taxExcludedBalance`, and tax-excluded summary totals.
  - Invoice-linked transactions use the invoice `subtotal / total` ratio for tax-excluded display values. Transactions without invoice tax detail fall back to their recorded ledger amount.
  - Invoice-linked transactions return `displayDescription` from invoice items using domain, hosting, catalog service/product, or item description labels, while preserving the original ledger `description`.

- `/api/invoices`
  - `ADMIN` or `SUPPORT` only.
  - Invoice list reads include invoice items and linked domain/hosting labels for operator display.
  - Invoice creation creates a `DRAFT` invoice.
  - Invoice issuance creates `INVOICE_DEBT` only after invoice status and stock checks pass inside the same database transaction.
  - Stock checks and stock movements apply only to `PRODUCT` catalog lines. `SERVICE` lines still contribute to invoice totals and ledger debt.
  - Direct-sale invoices may carry a unique `idempotencyKey` to prevent duplicate sale creation on retries.

- `/api/sales/direct`
  - `ADMIN` or `SUPPORT` only.
  - Creates one `SALE` invoice, one `INVOICE_DEBT`, product `OUT` stock movements for `PRODUCT` lines, and an optional `PAID` payment in one database transaction.
  - May create supplier purchases, supplier payable ledger entries, and domain/hosting operational records through the Purchasing And Suppliers and Domain And Hosting Operations contracts.
  - Server-side totals are authoritative. Client-side totals are only a preview.
  - `CREDIT` sales create invoice status `ISSUED` and no payment.
  - `PARTIAL` sales create invoice status `PARTIAL` and one paid payment for the collected amount.
  - `PAID` sales create invoice status `PAID` and one paid payment for the full total.
  - `PRODUCT` stock is decremented with an atomic quantity check. If any product has insufficient stock, no invoice, payment, account transaction, or stock movement is committed.
  - `SERVICE` lines do not affect stock and do not create stock movements.
  - Reusing the same `idempotencyKey` returns the existing invoice result instead of creating another sale.

- `/api/subscriptions`
  - Subscription mutations are `ADMIN` or `SUPPORT` only.
  - Subscription creation may create due payment schedule rows server-side in the same transaction.
  - Subscription due schedule rows are not ledger debt and are not payment credits by themselves.

## Running Balance Rule

Account transactions use:

```text
newBalance = previousBalance + debit - credit
```

Use `src/lib/accounting-ledger.ts` for new account transactions or balance rebuilds. Do not hand-write `balance` values in route handlers.

## Operational Risks

- Duplicate or client-side payment creation can overstate receivables.
- Missing auth on financial APIs exposes payment, invoice, and balance data.
- Non-transactional invoice issuance can leave invoice/accounting/stock partially mutated.
- Manually editing account transactions without rebuilding running balances can corrupt customer balances.
- Direct-sale retries without idempotency can duplicate invoices, customer debt, payments, and stock movements.
- Mixing supplier payable records into customer account transactions corrupts customer receivable balances.

## Rollback Strategy

- Disable the affected UI action first if duplicate or inconsistent financial records are being created.
- Revert the deployment only after preserving the affected payment, invoice, and account transaction IDs.
- Rebuild customer ledger balances using the server-side ledger helper or a controlled one-off script.
- For invoice issuance failures, verify invoice status, related account transaction count, stock movement count, and product stock before retrying.
- For direct-sale incidents, first search by `invoices.idempotencyKey`; then verify the invoice, payment, account transaction, and stock movement rows as one unit.
- If supplier purchase data exists on the sale, also verify supplier purchases, supplier payments, supplier account transactions, and domain/hosting records.
