# ADR 0002: Server-Side Accounting And Finance Ledger Contract

Date: 2026-07-02

## Status

Accepted

## Context

Payments, subscription payment schedules, invoices, customer account transactions, and stock movements were being mutated through multiple route-local and client-side behaviors.

Important financial side effects were not consistently server-side:

- Creating a paid payment did not create a `PAYMENT_CREDIT` account transaction.
- Subscription creation could trigger multiple client-side payment API calls after the subscription was already created.
- Invoice issuance updated invoice and account state before all stock checks completed.
- Financial APIs could be reached without an authenticated application session.

This created risks of incorrect balances, duplicate payments, partial invoice issuance, and hidden financial failures.

## Decision

Accounting And Finance now uses an explicit server-side ledger contract:

- Financial API routes require authenticated access, with `ADMIN` and `SUPPORT` required for financial mutations.
- `Payment.status === "PAID"` is the source of truth for creating `PAYMENT_CREDIT`.
- `DUE` and `LATE` payments are schedule/receivable plan records and do not create payment credit.
- Payment create, update, and delete operations run in database transactions and synchronize related account transactions.
- Account transaction running balance is created or rebuilt through `src/lib/accounting-ledger.ts`.
- Subscription creation may create due payment schedule rows server-side in the same transaction.
- Invoice issuance validates status and stock first, then updates invoice, accounting, and stock inside one transaction.

## Consequences

- Client components must not create additional payment rows to represent remainder logic.
- New financial mutations must use the ledger helper instead of writing ad hoc `balance` values.
- Subscription-created payments are not ledger debt. A future ADR is required before subscription dues become account receivables.
- Operational troubleshooting can verify ledger effects by following `paymentId`, `invoiceId`, and account transaction rows.
- Customer-facing payment reads remain possible only for the customer's own `customerId`.

## Rollback

If the contract introduces an incident:

1. Stop the affected financial UI or API mutation path.
2. Preserve affected payment, invoice, subscription, and account transaction IDs.
3. Revert the deployment.
4. Reconcile account transactions by customer using debit/credit totals and running-balance rebuild.
5. Record any manual financial correction in the changelog or an incident note.
