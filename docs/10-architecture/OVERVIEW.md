# Architecture Overview

This document captures the architecture that is currently documented and repository-observable. It must not be treated as permission to invent undocumented systems.

## Current Technical Baseline

- Framework: Next.js application using the App Router.
- Language: TypeScript.
- Database access: Prisma.
- Database provider: PostgreSQL through `DATABASE_URL`.
- UI component style: React components under `src/components`, including local UI primitives under `src/components/ui`.
- Primary application surfaces observed in routes:
  - Admin
  - Customer portal
  - Customer management
  - Domains
  - Hosting
  - Subscriptions
  - Proposals
  - Accounting and invoices
  - Products and stock
  - Settings
  - Notifications
  - Files and uploads

## Source Of Truth

Architecture is defined by this documentation layer and ADRs. Code can reveal implementation facts, but code alone does not define intended architecture.

When implementation and documentation disagree:

1. Stop and identify the disagreement.
2. Decide whether the code is wrong, the docs are stale, or the intended architecture needs an ADR.
3. Update the knowledge layer as part of the change.

## Architectural Priorities

1. Stability
2. Data correctness
3. Observability
4. Integration correctness
5. Operational clarity
6. Maintainability
7. Performance
8. UI polish

## Integration Requirements

Every integration must document and implement:

- Retry and backoff behavior
- Health handling
- Timeout handling
- Logout or session cleanup where applicable
- Idempotent operation behavior
- Failure visibility for operators

## Change Discipline

Architecture changes require:

- ADR update
- Relevant module documentation update
- Changelog update

Examples of architecture changes:

- New bounded context
- New integration
- New persistence model that changes ownership or financial behavior
- Cross-context dependency
- Background job, queue, scheduler, webhook, or notification lifecycle
- Authentication/session model change

## Known Documentation Gaps

- Module READMEs are not yet present for each bounded context.
- Integration runbooks are not yet complete.
- Product identity has not yet been formally selected between the project types listed in `docs/00-product/CONSTITUTION.md`.

