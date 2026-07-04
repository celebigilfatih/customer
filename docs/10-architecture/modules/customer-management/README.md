# Customer Management Module

## Ownership

Customer Management owns the customer lifecycle record:

- Customer identity and profile fields
- Company/contact/address fields
- Customer notes attached to the lifecycle record
- Admin customer list and customer detail surfaces
- Customer API access rules for customer records

## Boundaries

Customer Management does not own financial state. It must not calculate customer balances, create account transactions, or infer ledger status from UI state.

Accounting And Finance owns balances, account transactions, payments, and invoices. Customer detail screens may display accounting data, but they must fetch it from Accounting And Finance APIs.

## Admin UI Contract

- `/admin/customers` is the single admin entry point for customer records.
- `/admin/customers/[id]` is the customer detail surface.
- Customer detail uses tabs:
  - `general`: profile, contact, company, address, and notes.
  - `accounting`: accounting summary from `/api/accounting/customers/[id]`.
  - `transactions`: account transactions from `/api/accounting/customers/[id]`.
- The customer list must stay operationally focused and must not grow into a financial report. Financial detail belongs inside the customer detail tabs or Accounting And Finance reports.
- The customer list may show a compact read-only accounting status summary for operator orientation. The values must come from Accounting And Finance records and must not create, mutate, or recalculate ledger state inside Customer Management.
- Legacy customer routes under `/customers/*` redirect to the admin customer routes.

## Lifecycle Status Rules

- New customers default to `POTENTIAL`.
- A successful direct sale activates a customer by changing `POTENTIAL` to `ACTIVE` inside the same server-side transaction as the sale.
- Direct sale activation must not silently reopen customers deliberately marked `INACTIVE` or `LOST`.
- Customer status is lifecycle metadata owned by Customer Management. Sales flows may request the documented activation transition, but they must not infer or mutate financial state.

## Accounting Route Compatibility

The separate accounting customer list is removed from navigation. These legacy URLs remain compatible through redirects:

- `/admin/accounting/customers` -> `/admin/customers`
- `/admin/accounting/customers/[id]` -> `/admin/customers/[id]?tab=accounting`
- `/admin/accounting/customers/[id]/transactions` -> `/admin/customers/[id]?tab=transactions`

Accounting And Finance remains the owner of the backing API and ledger behavior.

## API Contract

- `/api/customers`
  - `GET`: `ADMIN` and `SUPPORT` only.
  - `POST`: `ADMIN` and `SUPPORT` only.
- `/api/customers/[id]`
  - `GET`: `ADMIN` and `SUPPORT` may read any customer. `CUSTOMER` may read only the customer record linked by `user.customerId`.
  - `PUT`, `DELETE`: `ADMIN` and `SUPPORT` only.

Customer portal features that need customer-owned profile reads must use the detail endpoint and must keep the `customerId` ownership check intact.

Customer portal users are created by Identity And Access with role `CUSTOMER` and must be linked to the matching customer through `user.customerId`. Customer Management owns the customer record; Identity And Access owns the user role and session.

## Dependencies

- `src/lib/api-auth.ts` for session, role, and customer ownership checks.
- `src/lib/routes.ts` for route helpers.
- Accounting And Finance APIs for current balance and account transaction data.

## Non-Responsibilities

Customer Management must not:

- Create or update `Payment`, `Invoice`, or `AccountTransaction` records.
- Compute running balances.
- Duplicate the accounting customer list.
- Expose all customer records to `CUSTOMER` role sessions.

## Operational Risks

- A duplicated customer/accounting list can lead operators to update the wrong surface.
- Missing API ownership checks can expose all customer records to a portal user.
- Displaying financial columns in the main customer list can blur Customer Management and Accounting And Finance ownership.

## Rollback Strategy

- Re-enable the legacy accounting customer navigation only if the unified customer detail route is unavailable.
- Keep legacy redirects in place during rollback to avoid operator-facing 404s.
- If customer API auth blocks legitimate portal access, verify `user.customerId` linkage before widening permissions.
