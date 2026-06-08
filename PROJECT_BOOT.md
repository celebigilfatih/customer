# Project Boot

This repository is operated as an AI-native long-term production software project.

The repository is the source of truth. Chat history is not source of truth. If a decision, operational rule, boundary, integration behavior, or architecture assumption matters, it must be captured in repository documentation before the related task is closed.

## Required Reading Order

Before implementation work, read these files in order:

1. `PROJECT_BOOT.md`
2. `docs/00-product/CONSTITUTION.md`
3. `docs/10-architecture/OVERVIEW.md`
4. `docs/10-architecture/BOUNDED_CONTEXTS.md`
5. The relevant module README, if one exists
6. Latest ADRs in `docs/30-adrs/`
7. Recent entries in `CHANGELOG.md`

If any required file is missing, create or restore the knowledge layer before making architecture-impacting changes.

## Execution Contract

Every task starts by identifying:

- Bounded context
- Affected integrations
- Operational risks
- Documentation impact
- Rollback strategy

Before implementation:

- State assumptions.
- Validate consistency with documented architecture.
- Search existing implementations, ADRs, runbooks, and integration docs.

After implementation:

- Update the knowledge layer when behavior, architecture, operations, or assumptions changed.
- Add runbook notes when operators need new recovery or verification steps.
- Update `CHANGELOG.md` for user-visible, operational, or architecture-relevant changes.

## Non-Negotiable Rules

- Do not invent systems, integrations, flows, or abstractions that are not documented.
- Do not bypass bounded-context ownership.
- Do not create duplicate systems without first searching existing implementation and documentation.
- Integration work must define retry/backoff, health handling, timeout handling, logout/session cleanup where applicable, and idempotent operations.
- Operational stability is more important than feature count.
- No tribal knowledge: important discoveries must be documented.

## Knowledge Capture Checklist

Every task must end by evaluating:

- Should `docs/00-product/CONSTITUTION.md` change?
- Should an ADR be added?
- Should a runbook be updated?
- Should `CHANGELOG.md` be updated?
- Did architecture assumptions change?
- Did operational behavior change?

If yes, update the relevant repository files before closing the task.

