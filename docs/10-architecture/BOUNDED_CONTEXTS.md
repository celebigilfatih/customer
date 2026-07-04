# Bounded Contexts

This document defines current bounded-context ownership based on repository documentation and observable route/model names. Boundaries must be refined by ADR before large architecture changes.

## Boundary Rules

- Each bounded context owns its own business rules.
- Cross-domain leakage is forbidden.
- Shared UI components are allowed, but shared UI must not own domain rules.
- API routes must not silently mutate data owned by another context.
- Financial mutations must be auditable and explicit.

## Current Context Map

### Identity And Access

Owns:

- Admin and customer login/session behavior
- User/admin roles
- Authentication middleware

Observed implementation areas:

- `src/lib/auth.ts`
- `src/middleware.ts`
- `src/app/api/auth/`
- `src/app/login/`
- `src/app/admin/login/`
- `scripts/create-admin.mjs`
- `docs/10-architecture/modules/identity-and-access/README.md`

Non-responsibilities:

- Customer billing rules
- Subscription lifecycle rules
- Proposal approval rules

Operational requirements:

- Production login must not create default credentials.
- First production admin bootstrap must use an explicit operator-run script with environment-provided credentials.

### Customer Management

Owns:

- Customer records
- Customer status
- Customer profile fields
- Customer notes and files when attached to customer lifecycle

Observed implementation areas:

- `src/app/customers/`
- `src/app/admin/customers/`
- `src/app/api/customers/`
- `src/components/customer-*`

Non-responsibilities:

- Ledger correctness
- Invoice issuance
- Domain renewal logic

### Subscription And Renewal Management

Owns:

- Subscriptions
- Billing period and subscription status
- Renewal dates and lifecycle state
- Admin and portal "Süreli Hizmetler" subscription records

Observed implementation areas:

- `src/app/admin/subscriptions/`
- `src/app/portal/subscriptions/`
- `src/app/api/subscriptions/`
- `src/components/subscription-*`

Non-responsibilities:

- Payment ledger mutations unless explicitly delegated through accounting APIs
- Domain-specific registrar behavior

### Domain And Hosting Operations

Owns:

- Domain records
- Hosting records
- Renewal metadata
- Admin and portal "Süreli Hizmetler" domain/hosting records

Observed implementation areas:

- `src/app/admin/domains/`
- `src/app/admin/hosting/`
- `src/app/portal/domains/`
- `src/app/portal/hosting/`
- `src/app/api/domains/`
- `src/app/api/hosting/`
- `src/app/api/hostings/`
- `src/components/domain-*`
- `src/components/hosting-*`

Non-responsibilities:

- Financial balance calculation
- Customer identity/session behavior

### Proposals And Sales

Owns:

- Proposal creation
- Proposal status transitions
- Proposal approval/rejection/send/PDF flows
- Proposal types
- Direct sale operator workflow and sale invoice intent

Observed implementation areas:

- `src/app/admin/proposals/`
- `src/app/portal/proposals/`
- `src/app/api/proposals/`
- `src/app/admin/sales/`
- `src/app/api/sales/direct/`
- `src/app/admin/settings/proposal-types/`
- `src/components/proposal-*`
- `src/components/direct-sale-form.tsx`

Non-responsibilities:

- Invoice issuance after conversion unless documented by ADR
- Payment reconciliation
- Supplier payable ledger ownership

### Accounting And Finance

Owns:

- Account transactions
- Invoices
- Payments
- Balances
- Manual adjustments
- Financial reports

Observed implementation areas:

- `src/app/admin/accounting/`
- `src/app/admin/finance/`
- `src/app/api/accounting/`
- `src/app/api/invoices/`
- `src/app/api/payments/`
- `src/components/payment-*`

Non-responsibilities:

- Silent mutation of source domain records
- Subscription lifecycle decisions without an explicit integration contract
- Supplier payable ledger rules, which are owned by Purchasing And Suppliers

### Purchasing And Suppliers

Owns:

- Supplier cards
- Supplier purchases created from sale lines
- Supplier payments
- Supplier account transactions and supplier running balance
- Supplier payable audit trail

Observed implementation areas:

- `src/app/admin/suppliers/`
- `src/app/api/suppliers/`
- `src/lib/supplier-ledger.ts`
- `prisma/schema.prisma`
  - `Supplier`
  - `SupplierPurchase`
  - `SupplierPayment`
  - `SupplierAccountTransaction`

Non-responsibilities:

- Customer receivable balances
- Sale invoice numbering and customer debt recognition
- Product stock movements
- Domain/hosting renewal lifecycle decisions

Operational requirements:

- Supplier ledger mutations must be server-side and transactional.
- Supplier running balance uses purchase debt as balance-increasing and supplier payment as balance-decreasing.
- Domain/hosting direct-sale purchases must not create stock movements.

### Products And Stock

Owns:

- "Satış Kataloğu" product and service entries
- Product groups
- Stock movements

Observed implementation areas:

- `src/app/admin/products/`
- `src/app/api/products/`
- `src/app/api/product-groups/`

Non-responsibilities:

- Customer balances
- Proposal lifecycle unless product selection is explicitly documented as an input
- Financial recognition of sold services

### Notifications And Webhooks

Owns:

- Notification records
- Webhook configuration
- Webhook queue and retry operations
- Scheduled notification triggers

Observed implementation areas:

- `src/app/api/notifications/`
- `src/app/api/system/webhooks/`
- `src/app/api/cron/daily/`
- `src/app/admin/settings/webhooks/`
- `src/lib/webhook-config.ts`
- `prisma/schema.prisma`
  - `WebhookLog`
  - `WebhookQueue`
- `docs/10-architecture/modules/notifications-and-webhooks/README.md`

Non-responsibilities:

- Hiding delivery failures
- Owning business truth for the events being notified

Operational requirements:

- Retry/backoff
- Failure visibility
- Idempotency
- Health verification

### Settings

Owns:

- Application settings
- Key-value configuration
- Settings seed behavior

Observed implementation areas:

- `src/app/admin/settings/`
- `src/app/api/settings/`
- `src/lib/settings.ts`
- `src/lib/settings-client.ts`
- `src/lib/subscription-settings-client.ts`

Non-responsibilities:

- Domain behavior that should be modeled explicitly in its owning context

## Required Future Refinement

Each context needs a module README documenting:

- Ownership
- Boundaries
- Dependencies
- Responsibilities
- Non-responsibilities
- Operational risks
- Rollback notes
