# Changelog

All notable repository changes should be documented here.

## 2026-07-04

### Added

- Added ADR 0008 for sales management and safe cancellation.
- Added `/admin/sales`, `/admin/sales/[id]`, and `/admin/sales/[id]/edit` for sale listing, sale detail, limited metadata editing, and audited cancellation.
- Added sales list/detail/edit/cancel APIs over `Invoice.type = SALE` without introducing a duplicate sale model.
- Added safe sale cancellation with invoice `CANCELLED`, customer ledger reversal entries, cancelled payment status, stock `IN` reversal movements, unpaid supplier purchase cancellation, and domain/hosting cancellation notes.
- Added cancellation enum values for customer ledger, supplier ledger, supplier purchase status, and payment status.
- Added separate sidebar entries for `Satışlar` and `Yeni Satış`.
- Added a customer detail `Tahsilat Yap` action that opens manual collection with the customer preselected and returns to the customer ledger after save/cancel.
- Added a `/admin/finance` "Tahsil Edilecek" summary card and receivable list filter for active due or late payments.
- Added customer receivable context and a "Borç Kadar Doldur" action to manual collection forms opened from customer detail.

### Changed

- Excluded cancelled payments from active finance lists and summary cards by default.
- Refined `/admin/sales/[id]` into a compact summary-and-tabs layout for sale items, payments, ledger/stock effects, supplier purchases, and domain/hosting operations.
- Refined customer-scoped `/admin/finance/add` manual collection into a two-panel layout with compact payment fields, receivable context, and primary collection actions.
- Added stronger receivable color and icon emphasis to the customer-scoped manual collection screen.
- Locked customer selection on customer-scoped manual collection so operators cannot accidentally switch customers after entering from customer detail.
- Refined customer accounting summary cards to show outstanding KDV-excluded balance, remaining KDV, and gross/legal remaining balance instead of lifetime debit and credit totals.
- Refined the customer detail page with a more compact information layout and added read-only search/type/direction/date filters for customer accounting transactions.
- Refined `/admin/dashboard` into a compact balanced overview with a daily summary band, today's work list, smaller quick actions, denser recent activity, and lower-height service totals.
- Balanced the `/admin/dashboard` lower section so recent activity and service totals share a two-column row on desktop.

### Fixed

- Added ADR 0007 for the payment-linked invoice delete contract.
- Refined the public login screen with a modern split layout, clearer form hierarchy, accessible password visibility control, and responsive mobile presentation.
- Refined `/admin/domains` to match the hosting list pattern with compact summary cards, renewal status detail, invoice source visibility, and the existing dense filter/table layout.
- Added authorized contact and compact read-only accounting summary columns to `/admin/customers` while keeping detailed ledger review in customer detail tabs.
- Expanded `/admin/customers` table rows with customer status and registration date context alongside authorized contact and accounting summary data.
- Activated sold customers automatically by moving `POTENTIAL` customers to `ACTIVE` inside the direct-sale transaction and backfilled existing sale customers with a data migration.
- Clarified `/admin/finance/add` as a manual collection surface that only records received money and no longer presents sale, invoice, subscription-plan, or due-status controls.
- Fixed admin user creation so new users receive an explicit `ADMIN`, `SUPPORT`, or `CUSTOMER` role instead of the legacy non-interactive `USER` default.
- Added customer linkage handling for `CUSTOMER` portal users and protected user-management APIs behind admin/support authentication.
- Fixed the `/admin/finance` payment source column so invoice-linked direct-sale collections show the sold domain, hosting, product, service, or free-form invoice item instead of an empty source.
- Updated `/admin/finance` payment deletion so a single-payment linked invoice is deleted in the same transaction, with invoice ledger rows removed, reversible stock movements restored, and customer balances rebuilt.

## 2026-07-03

### Documented

- Added a project health check and stabilization plan covering documentation gaps, route/API auth consistency, TypeScript/lint/build health, webhook/cron risks, dependency audit findings, and a low-risk cleanup sequence.
- Added ADR 0005 for the webhook persistence and retry contract.
- Added ADR 0006 for the Purchasing And Suppliers direct-sale contract.
- Added a Webhook Operations runbook covering logs, queue retry, timeout, idempotency, verification, and rollback.
- Added a Notifications And Webhooks module README and bounded-context references for webhook persistence ownership.
- Added a Purchasing And Suppliers module README and bounded-context references.
- Added Identity And Access module documentation and Hostinger/Coolify deployment runbook notes for separate PostgreSQL databases, upload persistence, health checks, and first-admin bootstrap.
- Documented the pre-production dependency audit gate for Coolify deployments after `npm audit` reported a critical Next.js advisory.

### Added

- Added managed catalog services through `Product.type = SERVICE`, alongside stock-tracked `PRODUCT` entries.
- Added `/admin/products/[id]/edit` so catalog entries can be edited after creation.
- Added supplier cards, supplier purchases, supplier payments, and supplier account transactions with migration `20260703070000_add_purchasing_and_suppliers`.
- Added `/admin/suppliers` and `/admin/suppliers/[id]` for supplier balance, purchases, payments, and payable ledger visibility.
- Added supplier APIs for supplier cards and full supplier-purchase payment closure.
- Added a Products And Stock module README and ADR 0004 for catalog services and stock-tracked products.
- Added durable `WebhookLog` and `WebhookQueue` Prisma models with migration `20260703020000_add_webhook_persistence`.
- Added a secure `admin:create` bootstrap script for creating the first production admin from environment-provided credentials.

### Changed

- Documented the local-to-Coolify database restore procedure, production backup requirement, post-restore admin verification, and ignored local DB backup artifacts.
- Added explicit validation scripts for Prisma schema validation, TypeScript type checking, and aggregate validation.
- Added customer summary links to the admin domain list so operators can see the related company/contact from `/admin/domains`.
- Refined `/admin/domains` with a compact filter toolbar and activated domain search, customer filtering, page-size selection, and pagination controls.
- Detailed `/admin/hosting` with customer-linked rows, renewal status, invoice source, compact summary cards, filters, page-size selection, and pagination controls.
- Updated the admin subscription list to load all subscriptions at once and apply filters across the full dataset.
- Refined `/admin/subscriptions` with a compact summary strip, dense filter toolbar, and lower-height subscription table card.
- Further refined `/admin/subscriptions` with grouped subscription/type rows, page-size selection, client-side pagination, and tighter action controls.
- Added real payment summary cards to `/admin/finance` for collected, open, overdue, and current-month collections.
- Updated `/admin/finance` summaries and payment rows to show tax-excluded amounts when invoice tax detail is available.
- Updated customer accounting detail tabs to show tax-excluded receivable amounts as the primary display while preserving gross/legal ledger values.
- Updated customer accounting transaction descriptions to show linked domain or hosting records when available.
- Standardized customer accounting and invoice item labels across domain, hosting, catalog services, products, and free-form invoice lines.
- Updated the admin invoice list to show tax-excluded invoice totals and linked domain/hosting service labels.
- Refined the admin customer list into a more compact layout by removing repeated header/action fields, replacing tall summary cards with a single summary strip, and consolidating company context into the customer row.
- Refined the admin dashboard with compact dynamic metric cards, proposal-aware service summaries, multi-source recent activity, and safer quick-action routing.
- Added a read-only admin dashboard summary API and simplified `/admin/dashboard` into a compact overview with critical KPIs, quick actions, today's reminders, recent activity, and service totals.
- Refined `/admin/finance` summary cards with shorter labels, lower card height, compact loading states, and a single tax-excluded helper note.
- Clarified `/admin/finance` amount labels so `Tutar` remains the gross amount and the tax-excluded display column is labeled `Fiyat`.
- Reordered `/admin/finance` payment columns so `Fiyat` appears before gross `Tutar`.
- Simplified `/admin/finance` payment table headers, removed the visible note column, and replaced edit/delete text actions with icon actions.
- Removed duplicate `/admin/finance` payment actions and converted the payment filters into a compact toolbar.
- Refined `/admin/finance` payment filters into a left-aligned grouped control bar with a combined due-date range.
- Updated `/admin/finance` summary cards so collected revenue shows tax-excluded amount and the adjacent card shows collected VAT.
- Refined `/admin/reports` with compact KPI cards, a dense filter toolbar, customer-aware report tables, and simplified export actions.
- Refined `/admin/tasks` with lower-height summary cards, a compact filter toolbar, less table chrome, and active status filtering.
- Refined `/admin/sales/new` with a denser direct-sale form layout, grouped payment summary panel, and more compact sale-line controls.
- Refined `/admin/proposals/add` with a denser proposal form layout, compact item table, and sticky proposal summary panel.
- Removed visible demo login credentials from the public login page.
- Disabled production auto-creation of default `admin/admin` credentials during login; development auto-bootstrap now requires `ALLOW_DEV_AUTO_ADMIN=true`.
- Simplified sidebar section headers by removing dropdown arrows and always showing grouped navigation items.
- Aligned sidebar menu items with section headers and separated menu groups with subtle divider lines.
- Smoothed sidebar hover styling and removed redundant item tooltips from the expanded menu.
- Restored collapsible sidebar menu groups and aligned the sidebar brand divider with the top bar divider.
- Excluded generated Prisma client output from ESLint so lint failures reflect application code and scripts.
- Required email in user creation validation and normalized empty optional full-name input to a safe server-side fallback.
- Updated direct sale and invoice issue flows so only `PRODUCT` catalog lines validate/decrement stock and create stock movements.
- Extended direct sale with optional line-level supplier purchase data, supplier payable ledger writes, and domain/hosting operational record creation in the same transaction.
- Updated product catalog APIs and admin UI to show and manage product/service type.
- Treated Domain and Hosting catalog group selections as on-demand services by default instead of stock-tracked products.
- Clarified UI terminology by renaming operational service navigation to `Süreli Hizmetler` and product/service catalog navigation to `Satış Kataloğu`.
- Updated cron/webhook expiring-service payload generation to read hosting labels from the current `Hosting.name` field.
- Kept CommonJS seed and Docker healthcheck scripts runtime-compatible while narrowing ESLint exceptions to their `require` imports.
- Centralized webhook POST delivery with HMAC signing, timeout handling, and idempotent retry queue deduplication.
- Removed Next build type/lint bypasses now that `npm run validate` passes.
- Restricted product and product-group APIs to `ADMIN`/`SUPPORT` sessions.

### Fixed

- Made stock adjustment discoverable from the sales catalog list and catalog edit page, clarified minimum-stock status labels, and kept service catalog entries non-stock.
- Updated older dynamic API route handlers for Next 15 `params` compatibility in domain, hosting, notes, and proposal-send routes.
- Fixed admin user add/edit form typing for Zod input/output handling.
- Fixed payment list client typing by using an API JSON DTO instead of the Prisma runtime model.
- Fixed proposal PDF amount formatting by converting Prisma `Decimal` values before locale currency rendering.
- Fixed the webhook logs route-local implicit `any` type.
- Cleared remaining ESLint errors by replacing unsafe `any` catches/casts, escaping JSX text entities, and removing obsolete `@ts-ignore` comments around `prisma.setting`.
- Fixed webhook retry log IDs so repeated queue attempts do not collide on the log primary key.
- Prevented service sales from requiring fake stock or producing stock movements.
- Prevented used or stocked catalog entries from being changed between product and service type.

## 2026-07-02

### Added

- Added an Accounting And Finance module README, ADR 0002, and an operations runbook for payment ledger, invoice issue, and subscription schedule behavior.
- Added `/admin/invoices` and `/admin/payments` surfaces so accounting sidebar links no longer land on 404 pages.
- Added a Customer Management module README documenting the unified customer list, customer detail tabs, accounting data boundary, and customer API access rules.
- Added `/admin/customers/[id]` detail tabs for general profile data, accounting summary, and account transactions.
- Added a Proposals And Sales module README documenting the current sales-flow boundaries and the missing direct-sale contract.
- Added `/admin/sales/new` as a direct-sale operator surface for customer, product/service line, tax, due date, and payment-mode entry.
- Added `POST /api/sales/direct` for idempotent direct sale creation with invoice, customer debt, stock movements, and optional payment in one transaction.
- Added ADR 0003 documenting the Direct Sale Server-Side Contract.

### Changed

- Fixed the local development server port at `3032` and updated the README startup URL.
- Moved subscription-generated payment schedules from client-side multi-call behavior into the server-side subscription creation transaction.
- Standardized account transaction running-balance writes through a shared ledger helper.
- Restricted financial API mutations to `ADMIN` and `SUPPORT` sessions, while customer payment reads are limited to the customer's own account.
- Consolidated customer receivable navigation into the single `/admin/customers` entry point and redirected legacy accounting customer URLs to the relevant customer detail tabs.
- Added `Invoice.idempotencyKey` so direct-sale retries can return the existing invoice without duplicate ledger or stock side effects.
- Changed proposal approval so it only marks proposals `APPROVED`; customer debt and stock movement now occur only through invoice/direct-sale contracts.

### Fixed

- Created `PAYMENT_CREDIT` account transactions for `PAID` payments and removed/rebuilt them when payments are reverted or deleted.
- Wrapped invoice issuance accounting and stock mutations in one transaction after stock validation.
- Fixed finance/accounting hydration warnings caused by breadcrumb separator markup and `next-themes` html class changes.
- Fixed financial route error handling so API errors are not returned as empty JSON objects.
- Removed duplicate finance navigation by consolidating collection and reporting links under the accounting sidebar section.
- Protected customer APIs so unauthenticated requests are rejected, admin/support users can manage customer records, and customer users can read only their own linked detail record.
- Linked invoice-related `PAYMENT_CREDIT` account transactions back to the invoice for audit traceability.

## 2026-06-08

### Fixed

- Fixed Docker production build by aligning runtime Prisma imports with the generated Prisma client path.
- Fixed Docker standalone runtime startup by including Prisma CLI dependencies and readable Prisma files in the runner image.
- Fixed Docker healthcheck execution by making the script readable by the runtime user and using IPv4 loopback inside the container.
- Added `curl` to the production image and changed Docker healthcheck to a Coolify-compatible HTTP health command.
- Fixed fresh Docker Compose migration flow for the hosting schema by making the early hosting simplification migration safe and aligning the later init migration with the current Prisma model.
- Moved Prisma migration startup into the Docker image default command so Dockerfile-based Coolify deployments run migrations before starting the app.

### Documented

- Added Coolify `DATABASE_URL` requirement and troubleshooting notes for Prisma migration startup failures.

### Added

- Established the AI Project Operating System knowledge layer.
- Added project boot instructions, product constitution, architecture overview, bounded contexts, ADR directory, runbook index, and changelog.
- Recorded ADR 0001 for repository-owned operational and architectural memory.
- Added Docker Compose deployment runbook with build, migration, health, and rollback notes.

### Notes

- Product identity is not yet formally selected between candidate project types.
- Module READMEs are still missing and should be added as bounded contexts are touched.
