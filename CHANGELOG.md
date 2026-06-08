# Changelog

All notable repository changes should be documented here.

## 2026-06-08

### Fixed

- Fixed Docker production build by aligning runtime Prisma imports with the generated Prisma client path.
- Fixed Docker standalone runtime startup by including Prisma CLI dependencies and readable Prisma files in the runner image.
- Fixed Docker healthcheck execution by making the script readable by the runtime user and using IPv4 loopback inside the container.
- Fixed fresh Docker Compose migration flow for the hosting schema by making the early hosting simplification migration safe and aligning the later init migration with the current Prisma model.
- Moved Prisma migration startup into the Docker image default command so Dockerfile-based Coolify deployments run migrations before starting the app.

### Added

- Established the AI Project Operating System knowledge layer.
- Added project boot instructions, product constitution, architecture overview, bounded contexts, ADR directory, runbook index, and changelog.
- Recorded ADR 0001 for repository-owned operational and architectural memory.
- Added Docker Compose deployment runbook with build, migration, health, and rollback notes.

### Notes

- Product identity is not yet formally selected between candidate project types.
- Module READMEs are still missing and should be added as bounded contexts are touched.
