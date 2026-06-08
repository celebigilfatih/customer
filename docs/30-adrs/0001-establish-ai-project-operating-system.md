# ADR 0001: Establish AI Project Operating System

Date: 2026-06-08

## Status

Accepted

## Context

The project needs durable operational memory across long-running development, multiple chats, multiple AI systems, and future maintainers.

Previously, required project-operating documents were missing from the repository. This created a risk that architectural rules would exist only in chat and disappear between sessions.

## Decision

Create a repository-level knowledge layer that includes:

- `PROJECT_BOOT.md`
- `docs/00-product/CONSTITUTION.md`
- `docs/10-architecture/OVERVIEW.md`
- `docs/10-architecture/BOUNDED_CONTEXTS.md`
- `docs/30-adrs/`
- `docs/40-runbooks/`
- `CHANGELOG.md`

All future tasks must start from repository knowledge, not chat memory alone.

## Consequences

- Architecture changes now require ADR updates.
- Important operational discoveries must be persisted.
- Product identity must not be assumed from prompts or code alone.
- Missing module READMEs are now an explicit documentation gap.
- Future changes must evaluate constitution, ADR, runbook, changelog, architecture assumptions, and operational behavior before task closure.

## Rollback

Do not delete the knowledge layer without replacing it with equivalent repository-owned documentation and recording that decision in a superseding ADR.

