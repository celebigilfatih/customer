# ADR 0004: Catalog Services And Stock-Tracked Products

Date: 2026-07-03

## Status

Accepted

## Context

Direct sale supports both product and service lines. Before this decision, only stock-tracked `Product` records were manageable in the catalog. Operators could add a one-off manual service line in direct sale, but reusable services could not be managed as catalog entries.

Using ordinary product records as services was unsafe because any selected `productId` was treated as stock-tracked by sale and invoice issue flows. A service with zero stock could fail with insufficient stock, while a service with fake stock would create misleading stock movements.

## Decision

Catalog entries are represented by the existing `Product` model plus a required type:

- `PRODUCT`: stock-tracked physical or inventory-backed item.
- `SERVICE`: reusable non-stock service item.

Existing catalog entries remain `PRODUCT` by migration default.

Products And Stock owns catalog item type and stock behavior:

- `PRODUCT` entries may have stock quantity, minimum stock level, and stock movements.
- `SERVICE` entries have no stock tracking. Their stock quantity and minimum stock level are normalized to zero on creation/update.
- Stock adjustment APIs reject `SERVICE` entries.
- A catalog entry type may not be changed after it has stock movements, proposal items, invoice items, or positive stock. Operators must create a new catalog entry instead of rewriting historical meaning.

Sales and invoice flows now interpret catalog type server-side:

- Direct sale and invoice issue create stock movements only for `PRODUCT` lines.
- `SERVICE` lines remain linked to invoice items through `productId` for audit/reporting, but they do not decrement stock.
- Both `PRODUCT` and `SERVICE` lines still contribute to invoice totals and customer ledger debt.

## Consequences

- Operators can manage reusable services from the same catalog surface as products.
- Service sales no longer require fake stock.
- Historical invoice/proposal/stock meaning is protected by preventing unsafe type changes.
- Reports that group by product/catalog item can include both products and services, but stock reports must filter to `PRODUCT`.
- Future product/service reporting should make the type distinction visible.

## Operational Invariants

- A `SERVICE` catalog entry must not have new stock movements.
- Selling a `SERVICE` must not change `Product.stockQuantity`.
- Selling a `PRODUCT` must still perform stock availability checks and create an `OUT` stock movement.
- Invoice totals and account transactions include both products and services.
- Operators must reconcile historical stock before deactivating or replacing a used `PRODUCT`.

## Rollback

If service catalog behavior causes an incident:

1. Disable service creation or direct-sale selection while preserving affected IDs.
2. Identify affected catalog entries by `products.type = SERVICE`.
3. Verify invoices, invoice items, account transactions, and payments remain financially correct.
4. Confirm no stock movements were created for the affected service IDs after this ADR.
5. If a service was incorrectly created as `PRODUCT`, create a replacement `SERVICE`, deactivate the incorrect product, and document any manual reconciliation.
