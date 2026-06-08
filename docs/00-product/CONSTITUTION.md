# Product Constitution

This document defines durable product and operating principles for this repository.

## Core Philosophy

Code is temporary. Knowledge is infrastructure.

The repository is the source of truth. Chat conversations are not source of truth. If knowledge only exists in chat, it does not exist.

## Current Product Identity

The current repository evidence shows a Next.js and Prisma application for customer operations, subscriptions, domains, hosting, proposals, products, invoices, payments, users, settings, notifications, and portal/admin surfaces.

The final product classification is not yet formally decided in this repository. Do not claim the project is ThreatScope or Aidat Takip unless that decision is recorded by ADR and reflected in this constitution.

## Candidate Product Types

### ThreatScope

ThreatScope is an infrastructure intelligence platform.

Priority order:

1. Stability
2. Observability
3. Integration correctness
4. Operational clarity
5. Performance
6. UI polish

ThreatScope must never:

- Use fake monitoring data
- Hide integration failures
- Duplicate alarm engines
- Bypass retry/backoff lifecycle
- Mix domain ownership

### Aidat Takip Uygulamasi

Aidat Takip is a financial operations platform, resident/member management system, payment tracking system, and accounting-oriented workflow platform.

Priority order:

1. Data correctness
2. Financial consistency
3. Auditability
4. User simplicity
5. Automation
6. Reporting

Aidat Takip must never:

- Lose payment history
- Mutate financial records silently
- Allow inconsistent balances
- Bypass audit logging
- Hide failed transactions

## Repository-Wide Product Principles

- Operational stability is more important than feature count.
- Domain boundaries are product boundaries; user experience must not justify hidden cross-domain leakage.
- Financial and customer records require explicit, auditable mutation behavior.
- Integration failures must be visible to operators.
- Fake operational or financial data must not be used as if it were real.
- Documentation must explain why critical flows exist, not only where code lives.

## Change Rules

Update this constitution when:

- Product identity changes.
- Product priorities change.
- A non-negotiable product invariant is added, removed, or clarified.
- A new bounded context changes user, operator, or financial responsibility.

