# Proposal and Invoice Entities

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://prisma/schema.prisma)
- [route.ts](file://src/app/api/proposals/route.ts)
- [route.ts](file://src/app/api/proposals/[id]/approve/route.ts)
- [route.ts](file://src/app/api/proposals/[id]/reject/route.ts)
- [route.ts](file://src/app/api/proposals/[id]/send/route.ts)
- [route.ts](file://src/app/api/invoices/route.ts)
- [route.ts](file://src/app/api/invoices/[id]/issue/route.ts)
- [validations.ts](file://src/lib/validations.ts)
- [proposal-form.tsx](file://src/components/proposal-form.tsx)
- [proposal-detail.tsx](file://src/components/proposal-detail.tsx)
- [proposal-list.tsx](file://src/components/proposal-list.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the Proposal and Invoice entities and their relationship within the system. It covers:
- Proposal lifecycle: creation, sending, approval/rejection, expiration, and conversion to invoices
- ProposalItem model: product associations, quantities, pricing, and totals
- Invoice generation from proposals: tax calculations, payment tracking, and statuses
- Bidirectional relationship between proposals and invoices
- Approval workflow, approver tracking, rejection reasons, and expiration handling
- Examples of workflows and financial reporting via these entities

## Project Structure
The relevant backend APIs and frontend components are organized as follows:
- Backend API routes under src/app/api handle CRUD and workflow actions for proposals and invoices
- Validation schemas in src/lib define request shapes and constraints
- Frontend components in src/components manage proposal creation, viewing, and listing

```mermaid
graph TB
subgraph "Backend API"
PGet["GET /api/proposals"]
PPost["POST /api/proposals"]
PSend["POST /api/proposals/[id]/send"]
PApprove["POST /api/proposals/[id]/approve"]
PReject["POST /api/proposals/[id]/reject"]
IGet["GET /api/invoices"]
IPost["POST /api/invoices"]
IIssue["POST /api/invoices/[id]/issue"]
end
subgraph "Frontend Components"
PF["ProposalForm"]
PD["ProposalDetail"]
PL["ProposalList"]
end
PF --> PPost
PD --> PGet
PL --> PGet
PPost --> PGet
PSend --> PGet
PApprove --> PGet
PReject --> PGet
IPost --> IGet
IIssue --> IGet
```

**Diagram sources**
- [route.ts:1-118](file://src/app/api/proposals/route.ts#L1-L118)
- [route.ts:1-48](file://src/app/api/proposals/[id]/send/route.ts#L1-L48)
- [route.ts:1-121](file://src/app/api/proposals/[id]/approve/route.ts#L1-L121)
- [route.ts:1-63](file://src/app/api/proposals/[id]/reject/route.ts#L1-L63)
- [route.ts:1-170](file://src/app/api/invoices/route.ts#L1-L170)
- [route.ts:1-101](file://src/app/api/invoices/[id]/issue/route.ts#L1-L101)
- [proposal-form.tsx:1-468](file://src/components/proposal-form.tsx#L1-L468)
- [proposal-detail.tsx:1-415](file://src/components/proposal-detail.tsx#L1-L415)
- [proposal-list.tsx:1-274](file://src/components/proposal-list.tsx#L1-L274)

**Section sources**
- [route.ts:1-118](file://src/app/api/proposals/route.ts#L1-L118)
- [route.ts:1-170](file://src/app/api/invoices/route.ts#L1-L170)

## Core Components
- Proposal: A sales quotation with status, customer association, optional items, and metadata (number, title, type, amount, currency, validUntil, notes). Supports workflow transitions: DRAFT → SENT → PENDING → APPROVED/REJECTED → EXPIRED/CONVERTED.
- ProposalItem: Line items linked to a product (optional) with description, quantity, unitPrice, and totalPrice.
- Invoice: A financial document with type (SALE/RETURN), dates, tax rate, tax amount, subtotal, total, status, and bidirectional relation to Proposal (when created from a proposal).
- InvoiceItem: Line items linked to a product (optional) mirroring item structure.
- Validation schemas enforce constraints for creation and updates.

Key data model enums and relations:
- ProposalStatus: DRAFT, SENT, PENDING, APPROVED, REJECTED, EXPIRED, CONVERTED
- ProposalType: SUBSCRIPTION, PROJECT, MAINTENANCE, RENEWAL, NETWORK, HARDWARE, SOFTWARE, SERVICE, CONSULTING, OTHER
- InvoiceStatus: DRAFT, ISSUED, PARTIAL, PAID, CANCELLED
- InvoiceType: SALE, RETURN
- Proposal ↔ Customer (many-to-one)
- Proposal → ProposalItem (one-to-many)
- Invoice ↔ Customer (many-to-one)
- Invoice ← Proposal (many-to-one, optional)
- Invoice → InvoiceItem (one-to-many)
- Both Proposal and Invoice → AccountTransaction (financial ledger entries)
- Both Proposal and Invoice → StockMovement (inventory tracking)

**Section sources**
- [schema.prisma:435-443](file://prisma/schema.prisma#L435-L443)
- [schema.prisma:445-456](file://prisma/schema.prisma#L445-L456)
- [schema.prisma:645-693](file://prisma/schema.prisma#L645-L693)
- [schema.prisma:695-706](file://prisma/schema.prisma#L695-L706)
- [schema.prisma:629-643](file://prisma/schema.prisma#L629-L643)
- [schema.prisma:708-722](file://prisma/schema.prisma#L708-L722)

## Architecture Overview
The Proposal and Invoice subsystem integrates with:
- Prisma schema for persistence and relations
- API routes for business logic and transactions
- Validation schemas for request parsing and constraints
- Frontend components for user interaction and reporting

```mermaid
classDiagram
class Customer {
+string id
+string fullName
+string? firmaAdi
+string phoneNumber
+string city
+string district
+string? club
+string status
+string? price
+DateTime createdAt
+DateTime updatedAt
}
class Proposal {
+string id
+string number
+string title
+string type
+string? description
+Decimal amount
+string currency
+DateTime validUntil
+string status
+DateTime? sentAt
+string? approvedBy
+DateTime? approvedAt
+DateTime? rejectedAt
+string? rejectReason
+string? notes
+DateTime createdAt
+DateTime updatedAt
}
class ProposalItem {
+string id
+string proposalId
+string? productId
+string description
+Decimal quantity
+Decimal unitPrice
+Decimal totalPrice
}
class Invoice {
+string id
+string number
+string type
+Decimal subtotal
+Decimal taxRate
+Decimal taxAmount
+Decimal total
+string status
+DateTime issueDate
+DateTime dueDate
+string? notes
+DateTime createdAt
+DateTime updatedAt
}
class InvoiceItem {
+string id
+string invoiceId
+string? productId
+string description
+Decimal quantity
+Decimal unitPrice
+Decimal totalPrice
}
class AccountTransaction {
+string id
+string customerId
+string type
+Decimal debit
+Decimal credit
+Decimal balance
+string? proposalId
+string? invoiceId
+string? paymentId
+string? description
+DateTime createdAt
}
class StockMovement {
+string id
+string productId
+string type
+Decimal quantity
+string? proposalId
+string? invoiceId
+string? description
+DateTime createdAt
}
Customer "1" -- "many" Proposal : "has"
Proposal "1" -- "many" ProposalItem : "contains"
Customer "1" -- "many" Invoice : "has"
Proposal "1" -- "zero or one" Invoice : "converts to"
Invoice "1" -- "many" InvoiceItem : "contains"
Proposal "1" -- "many" AccountTransaction : "creates"
Invoice "1" -- "many" AccountTransaction : "creates"
Proposal "1" -- "many" StockMovement : "creates"
Invoice "1" -- "many" StockMovement : "creates"
```

**Diagram sources**
- [schema.prisma:95-134](file://prisma/schema.prisma#L95-L134)
- [schema.prisma:458-503](file://prisma/schema.prisma#L458-L503)
- [schema.prisma:629-643](file://prisma/schema.prisma#L629-L643)
- [schema.prisma:646-693](file://prisma/schema.prisma#L646-L693)
- [schema.prisma:708-722](file://prisma/schema.prisma#L708-L722)
- [schema.prisma:510-539](file://prisma/schema.prisma#L510-L539)
- [schema.prisma:602-620](file://prisma/schema.prisma#L602-L620)

## Detailed Component Analysis

### Proposal Entity Workflow
Proposal lifecycle and transitions:
- Creation: POST /api/proposals generates a unique number and persists items
- Sending: POST /api/proposals/[id]/send moves status from DRAFT to SENT
- Approval: POST /api/proposals/[id]/approve sets APPROVED, records approver/approval timestamp, creates a PROPOSAL_DEBT transaction, and performs stock OUT movements per item
- Rejection: POST /api/proposals/[id]/reject sets REJECTED with optional rejectReason
- Expiration: Not handled in provided routes; can be implemented via cron or manual update
- Conversion: When an invoice is created from a proposal, the proposal status becomes CONVERTED

```mermaid
sequenceDiagram
participant Client as "Admin UI"
participant API as "Proposal Routes"
participant DB as "Prisma"
Client->>API : POST /api/proposals
API->>DB : Create Proposal + items
DB-->>API : Proposal with number
API-->>Client : Created Proposal
Client->>API : POST /api/proposals/ : id/send
API->>DB : Update status=SENT
DB-->>API : Updated Proposal
API-->>Client : Sent Proposal
Client->>API : POST /api/proposals/ : id/approve
API->>DB : Begin transaction
API->>DB : Update status=APPROVED, set approvedBy/approvedAt
API->>DB : Create PROPOSAL_DEBT AccountTransaction
API->>DB : For each item : OUT StockMovement + update Product stock
API-->>Client : Approved Proposal + transaction
```

**Diagram sources**
- [route.ts:58-117](file://src/app/api/proposals/route.ts#L58-L117)
- [route.ts:1-48](file://src/app/api/proposals/[id]/send/route.ts#L1-L48)
- [route.ts:1-121](file://src/app/api/proposals/[id]/approve/route.ts#L1-L121)

**Section sources**
- [route.ts:1-118](file://src/app/api/proposals/route.ts#L1-L118)
- [route.ts:1-48](file://src/app/api/proposals/[id]/send/route.ts#L1-L48)
- [route.ts:1-121](file://src/app/api/proposals/[id]/approve/route.ts#L1-L121)
- [route.ts:1-63](file://src/app/api/proposals/[id]/reject/route.ts#L1-L63)
- [validations.ts:200-233](file://src/lib/validations.ts#L200-L233)

### ProposalItem Model
ProposalItem captures per-line details:
- Optional productId links to Product
- Description, quantity, unitPrice, totalPrice
- Calculations are driven by the frontend form and validated server-side

```mermaid
flowchart TD
Start(["Edit Proposal Item"]) --> Qty["User sets quantity"]
Qty --> Calc["Compute totalPrice = quantity × unitPrice"]
Calc --> Persist["Persist item to Proposal"]
Persist --> End(["Done"])
```

**Diagram sources**
- [proposal-form.tsx:140-170](file://src/components/proposal-form.tsx#L140-L170)
- [schema.prisma:629-643](file://prisma/schema.prisma#L629-L643)

**Section sources**
- [schema.prisma:629-643](file://prisma/schema.prisma#L629-L643)
- [proposal-form.tsx:125-170](file://src/components/proposal-form.tsx#L125-L170)
- [validations.ts:190-198](file://src/lib/validations.ts#L190-L198)

### Invoice Generation from Proposals
Invoice creation supports:
- Tax calculation: subtotal, taxAmount, total computed from items and taxRate
- Status management: DRAFT initially; ISSUED via POST /api/invoices/[id]/issue
- Bidirectional relation: invoice.proposalId links back to originating Proposal
- Financial impact: creates INVOICE_DEBT transaction and performs stock OUT movements

```mermaid
sequenceDiagram
participant Client as "Admin UI"
participant IAPI as "Invoice Routes"
participant PAPI as "Proposal Routes"
participant DB as "Prisma"
Client->>IAPI : POST /api/invoices
IAPI->>DB : Compute subtotal/tax/total
IAPI->>DB : Create Invoice (DRAFT) + items
IAPI->>DB : If proposalId set : Update Proposal.status=CONVERTED
DB-->>IAPI : Invoice
IAPI-->>Client : Created Invoice
Client->>IAPI : POST /api/invoices/ : id/issue
IAPI->>DB : Update status=ISSUED
IAPI->>DB : Create INVOICE_DEBT AccountTransaction
IAPI->>DB : For each item : OUT StockMovement + update Product stock
DB-->>IAPI : Updated Invoice
IAPI-->>Client : Issued Invoice
```

**Diagram sources**
- [route.ts:79-169](file://src/app/api/invoices/route.ts#L79-L169)
- [route.ts:1-101](file://src/app/api/invoices/[id]/issue/route.ts#L1-L101)

**Section sources**
- [route.ts:1-170](file://src/app/api/invoices/route.ts#L1-L170)
- [route.ts:1-101](file://src/app/api/invoices/[id]/issue/route.ts#L1-L101)
- [schema.prisma:646-693](file://prisma/schema.prisma#L646-L693)

### Financial Reporting Through Entities
AccountTransaction tracks debits/credits per Proposal/Invoice/Payment:
- PROPOSAL_DEBT and INVOICE_DEBT types record receivables
- Running balance maintained per transaction
- Ledger ties to Proposal, Invoice, and Payment entities

```mermaid
erDiagram
ACCOUNT_TRANSACTION {
string id PK
string customerId
string type
decimal debit
decimal credit
decimal balance
string? proposalId
string? invoiceId
string? paymentId
string? description
datetime createdAt
}
PROPOSAL ||--o{ ACCOUNT_TRANSACTION : "creates"
INVOICE ||--o{ ACCOUNT_TRANSACTION : "creates"
PAYMENT ||--o{ ACCOUNT_TRANSACTION : "creates"
```

**Diagram sources**
- [schema.prisma:510-539](file://prisma/schema.prisma#L510-L539)

**Section sources**
- [schema.prisma:510-539](file://prisma/schema.prisma#L510-L539)

### Frontend Integration
- ProposalForm: Creates proposals with items, computes totals, and posts to /api/proposals
- ProposalDetail: Displays proposal details, handles approval/rejection actions, and PDF export
- ProposalList: Filters and paginates proposals, supports actions (view/edit/download/delete)

```mermaid
sequenceDiagram
participant UI as "ProposalForm"
participant API as "POST /api/proposals"
participant DB as "Prisma"
UI->>API : Submit form (items, amount, metadata)
API->>DB : Validate + persist Proposal + items
DB-->>API : Proposal with number
API-->>UI : Success -> navigate/list refresh
```

**Diagram sources**
- [proposal-form.tsx:172-192](file://src/components/proposal-form.tsx#L172-L192)
- [route.ts:58-117](file://src/app/api/proposals/route.ts#L58-L117)

**Section sources**
- [proposal-form.tsx:1-468](file://src/components/proposal-form.tsx#L1-L468)
- [proposal-detail.tsx:1-415](file://src/components/proposal-detail.tsx#L1-L415)
- [proposal-list.tsx:1-274](file://src/components/proposal-list.tsx#L1-L274)

## Dependency Analysis
- API routes depend on Prisma client and Zod validation schemas
- Proposal routes coordinate transactions for approvals and stock updates
- Invoice routes compute taxes and maintain bidirectional relations
- Frontend components depend on API endpoints and settings for proposal types

```mermaid
graph LR
V["validations.ts"] --> PR["proposals/route.ts"]
V --> IR["invoices/route.ts"]
PR --> DB["Prisma Client"]
IR --> DB
PF["proposal-form.tsx"] --> PR
PD["proposal-detail.tsx"] --> PR
PL["proposal-list.tsx"] --> PR
```

**Diagram sources**
- [validations.ts:190-243](file://src/lib/validations.ts#L190-L243)
- [route.ts:1-118](file://src/app/api/proposals/route.ts#L1-L118)
- [route.ts:1-170](file://src/app/api/invoices/route.ts#L1-L170)
- [proposal-form.tsx:1-468](file://src/components/proposal-form.tsx#L1-L468)
- [proposal-detail.tsx:1-415](file://src/components/proposal-detail.tsx#L1-L415)
- [proposal-list.tsx:1-274](file://src/components/proposal-list.tsx#L1-L274)

**Section sources**
- [validations.ts:190-243](file://src/lib/validations.ts#L190-L243)
- [route.ts:1-118](file://src/app/api/proposals/route.ts#L1-L118)
- [route.ts:1-170](file://src/app/api/invoices/route.ts#L1-L170)

## Performance Considerations
- Use database indexes on frequently filtered fields (status, type, customerId) as defined in Prisma schema
- Batch operations for item creation/update to minimize round-trips
- Prefer server-side pagination for proposal/invoice lists
- Validate monetary values as decimals to avoid precision loss
- Use transactions for approval/issuance to ensure atomicity of financial and inventory updates

## Troubleshooting Guide
Common issues and resolutions:
- Validation errors on proposal creation: ensure items conform to schema and amount is positive
- Approval failures: verify proposal status is SENT or PENDING and product stocks are sufficient
- Issuance failures: confirm invoice status is DRAFT and product stocks are sufficient
- PDF export: ensure the PDF endpoint is reachable and the proposal exists

**Section sources**
- [route.ts:110-117](file://src/app/api/proposals/route.ts#L110-L117)
- [route.ts:108-120](file://src/app/api/proposals/[id]/approve/route.ts#L108-L120)
- [route.ts:94-100](file://src/app/api/invoices/[id]/issue/route.ts#L94-L100)

## Conclusion
The Proposal and Invoice subsystem provides a robust foundation for sales quoting, approval workflows, and invoicing with integrated financial and inventory tracking. The design leverages Prisma relations, server-side transactions, and frontend components to support end-to-end business processes, enabling accurate financial reporting and operational visibility.