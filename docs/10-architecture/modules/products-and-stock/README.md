# Products And Stock Module

## Ownership

Products And Stock owns the "Satış Kataloğu" and stock state:

- Sales catalog entries
- Product and service type classification
- Product groups
- Product stock quantity
- Stock movements
- Stock adjustment operations

## Boundaries

Products And Stock owns whether a catalog entry is stock-tracked.

Accounting And Finance owns invoices, payments, ledger entries, and balances. Proposals And Sales may select catalog entries for proposals or direct sale, but it must not decide stock behavior from client-side state.

## Catalog Types

Catalog entries use `Product.type`:

- `PRODUCT`: stock-tracked item.
- `SERVICE`: reusable non-stock service item.

Existing entries default to `PRODUCT`.

`SERVICE` entries:

- are managed from the same admin catalog surface as products;
- represent on-demand sold services such as domain registration, hosting provisioning, maintenance, consulting, or setup work;
- can be selected in proposals and direct sale;
- are linked to invoice items through `productId`;
- do not create stock movements;
- do not decrement `stockQuantity`;
- cannot be adjusted from stock management APIs.

`PRODUCT` entries:

- represent stock-tracked physical or inventory-backed items;
- may have opening stock;
- may have minimum stock level;
- create `IN` stock movement for opening stock;
- create `OUT` stock movement when sold through direct sale or invoice issue.

## Admin UI Surface

- `/admin/products`: "Satış Kataloğu" list for products and services.
- `/admin/products/add`: create product or service catalog entries.
- `/admin/products/[id]/edit`: edit catalog metadata and price.
- `/admin/products/[id]/stock`: stock movements and adjustments for `PRODUCT` entries only.
- `/admin/products/groups`: product/service grouping.

## Server-Side Contracts

- `/api/products`
  - `ADMIN` or `SUPPORT` only.
  - `GET` lists catalog entries and supports `isActive` and `type` filters.
  - `POST` creates `PRODUCT` or `SERVICE`.
  - `SERVICE` creation normalizes stock fields to zero and creates no opening stock movement.
  - `PRODUCT` creation may create an opening `IN` stock movement.

- `/api/products/[id]`
  - `ADMIN` or `SUPPORT` only.
  - Updates catalog metadata and price.
  - Rejects type changes after stock movements, proposal items, invoice items, or positive stock exist.

- `/api/products/[id]/stock`
  - `ADMIN` or `SUPPORT` only.
  - Accepts stock adjustments only for `PRODUCT`.
  - Rejects stock adjustments for `SERVICE`.

- `/api/product-groups`
  - `ADMIN` or `SUPPORT` only.
  - Manages active catalog grouping.

## Integration Rules

Direct sale and invoice issue must read catalog type server-side:

- For `PRODUCT`, validate stock, decrement stock, and create `OUT` movement.
- For `SERVICE`, skip stock validation and stock movement.
- Both types may create invoice items and financial ledger effects through Accounting And Finance.

## Operational Risks

- Treating services as products can create fake stock or insufficient-stock failures.
- Domain and hosting sale catalog entries must not be modeled as stocked products when they are purchased/provisioned on demand.
- Changing the type of a used catalog entry can rewrite historical meaning for invoices, proposals, and stock reports.
- Manual stock changes for service entries would create misleading operational records.

## Rollback Notes

- If a service was mistakenly created as `PRODUCT`, create a replacement `SERVICE`, deactivate the incorrect product, and reconcile any stock movements before changing reports.
- If a product was mistakenly created as `SERVICE`, create a replacement `PRODUCT` and add opening stock through stock adjustment.
- Before correcting any sale, preserve invoice, invoice item, account transaction, payment, product, and stock movement IDs.
