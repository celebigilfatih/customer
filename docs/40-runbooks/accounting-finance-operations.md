# Accounting And Finance Operations Runbook

## Purpose

Use this runbook when investigating payment, invoice, customer balance, or subscription payment schedule issues.
For supplier purchase and payable issues, use this runbook together with the Purchasing And Suppliers module README.

## Health Checks

- Cookies without `auth-token` and a valid `role` must receive `401` from:
  - `/api/payments`
  - `/api/invoices`
  - `/api/accounting/customers`
  - `/api/sales/direct`
  - `/api/suppliers`
- `ADMIN` or `SUPPORT` sessions must receive `200` from those read endpoints.
- `ADMIN` or `SUPPORT` sessions may create direct sales through `/api/sales/direct`.
- `ADMIN` or `SUPPORT` sessions may manage suppliers and supplier payments through `/api/suppliers`.
- A `CUSTOMER` session may read `/api/payments` only for its own `customerId`.
- A `CUSTOMER` session must receive `403` from `/api/sales/direct`.
- A `CUSTOMER` session must receive `403` from `/api/suppliers`.

## Payment Ledger Verification

For a payment ID:

1. Read the `Payment` row.
2. If `status = PAID`, verify exactly one `account_transactions` row with:
   - `paymentId = <payment id>`
   - `type = PAYMENT_CREDIT`
   - `credit = payment.amount`
   - `debit = 0`
3. If `status = DUE` or `LATE`, verify no `PAYMENT_CREDIT` row remains for that payment.
4. Recalculate customer balance as `sum(debit) - sum(credit)`.

## Invoice Issue Verification

Before retrying a failed invoice issue:

1. Confirm invoice status is still `DRAFT` if the issue failed.
2. Confirm no `account_transactions` row exists for the invoice if stock was insufficient.
3. Confirm no stock movement was created for the invoice.
4. Confirm product stock quantity is unchanged.
5. Retry only after stock is corrected or invoice quantities are changed.

## Direct Sale Verification

For a direct-sale `idempotencyKey`:

1. Read the invoice by `invoices.idempotencyKey`.
2. Verify invoice `type = SALE`.
3. Verify invoice status by payment mode:
   - `CREDIT`: `ISSUED`
   - `PARTIAL`: `PARTIAL`
   - `PAID`: `PAID`
4. Verify exactly one `INVOICE_DEBT` account transaction exists for the invoice and customer.
5. For `PRODUCT` invoice items, verify one `OUT` stock movement per product line and confirm product stock was reduced by the sold quantity.
6. For `SERVICE` invoice items, verify no stock movement was created and service stock quantity remained zero.
7. If payment was collected, verify:
   - one `payments` row with `status = PAID`
   - `payments.invoiceId = invoice.id`
   - one `PAYMENT_CREDIT` account transaction with `paymentId = payment.id`
   - the payment credit also carries `invoiceId = invoice.id`
8. Recalculate customer balance as `sum(debit) - sum(credit)`.
9. If the sale included supplier purchase data, verify:
   - one `supplier_purchases` row per purchase-enabled sale line
   - each purchase links to the sale `invoiceId` and `invoiceItemId`
   - one `PURCHASE_DEBT` supplier account transaction exists per supplier purchase
   - supplier balance increased by purchase total
10. If a supplier purchase was marked paid, verify:
   - one `supplier_payments` row exists for the purchase
   - one `SUPPLIER_PAYMENT` supplier account transaction exists
   - supplier balance decreased by the payment amount
   - the related supplier purchase status is `PAID`
11. If the sale included domain/hosting operation data, verify:
   - the domain or hosting row exists
   - it links to the sale `invoiceId` and `invoiceItemId`
   - no stock movement exists for the same `SERVICE` line

For idempotent retry checks:

- Re-send the same payload with the same `idempotencyKey`.
- Expect `200` and the existing invoice result.
- Confirm invoice, payment, account transaction, stock movement, supplier purchase, supplier payment, supplier account transaction, and domain/hosting counts did not increase.

## Direct Sale Failure And Rollback

If stock is insufficient:

1. Confirm the API returned `400`.
2. Confirm no invoice exists for the request `idempotencyKey`.
3. Confirm no payment, account transaction, or stock movement was created.
4. Confirm no supplier purchase, supplier payment, supplier account transaction, domain, or hosting record was created.
5. Confirm product stock is unchanged.
6. Correct stock or sale quantities before retrying.

If a service sale fails with stock errors:

1. Read the selected catalog entry from `products`.
2. Confirm `products.type = SERVICE`.
3. If the entry is actually `PRODUCT`, create a replacement `SERVICE` entry and retry the sale with that service ID.
4. Do not add fake stock to service-like products to bypass sale validation.

If a direct sale was duplicated:

1. Disable the `/admin/sales/new` action if duplicates are still being produced.
2. Search both duplicate invoice numbers and `idempotencyKey` values.
3. Preserve invoice, payment, account transaction, and stock movement IDs before correction.
4. Reconcile against external payment/bank evidence before deleting payment rows.
5. Reverse or remove duplicate stock movement effects only after identifying the invoice item that caused them.
6. Rebuild the affected customer ledger balances after any account transaction correction.
7. If supplier records were duplicated, preserve supplier purchase/payment/transaction IDs before correction and rebuild supplier balances in chronological order.

If a supplier purchase was created but should not have been:

1. Confirm whether the customer sale invoice should remain valid.
2. Preserve the supplier purchase and supplier account transaction IDs.
3. If no external supplier invoice/payment exists, remove or reverse the supplier payable records in a controlled maintenance window.
4. If supplier payment exists, reconcile against bank evidence before changing records.
5. Rebuild the supplier running balance using `balance = previous + credit - debit`.

## Subscription Payment Schedule Verification

After subscription creation:

- Monthly subscriptions with `installmentCount` should create that many `DUE` payment rows.
- Yearly subscriptions with `yearlyPlan = installments` should create 12 `DUE` payment rows.
- Yearly subscriptions with `yearlyPlan = single` should create one `DUE` payment row.
- These schedule rows must not create account transactions until they become `PAID`.

## Recovery

- For an incorrect running balance, rebuild balances for the affected customer by ordering account transactions by `createdAt` then `id` and applying `balance = previous + debit - credit`.
- For duplicate payment credits, keep one `PAYMENT_CREDIT` for the payment, delete duplicates, and rebuild the affected customer ledger.
- For client-side duplicate payment rows created before this contract, reconcile each duplicate against the actual bank/payment evidence before deleting anything.
- For direct-sale duplicate invoices, prefer an explicit corrective entry or controlled cleanup over silent row deletion when external documents or payments may already have been shared.

## Rollback

- Disable the impacted finance UI action if duplicate or partial financial records are still being created.
- Revert deployment only after recording affected IDs.
- After rollback, verify auth behavior did not reopen unauthenticated financial API access.
