# Project Health Check And Stabilization Plan

Date: 2026-07-03

## Purpose

This report records the current repository health before adding more product features.
The goal is to make the project easier to maintain, safer to operate, and easier for
future AI or human maintainers to understand without relying on chat history.

## Scope

Reviewed areas:

- Required project knowledge layer.
- Bounded-context and module documentation.
- ADRs and runbooks.
- App Router route/API inventory.
- Authentication and authorization surface.
- Prisma schema and migration status.
- Lint, TypeScript, build, and dependency audit signals.
- High-risk operational flows: finance, direct sale, products/stock, cron, webhooks.

No application behavior was intentionally changed by this report.

## Current Health Summary

Overall status: usable but not yet sustainably clean.

Positive signals:

- The AI Project Operating System knowledge layer exists.
- Prisma schema validates.
- Local database migration status is up to date.
- Recent Accounting, Direct Sale, and Product/Service decisions are captured by ADRs.
- Webhook persistence and retry behavior are captured by ADR 0005.
- Recent finance/sales module documentation is materially better than the older project baseline.
- `npm run validate` currently passes.
- Production build currently completes with type and lint validation enabled.

Primary concern:

- Route-local API authorization is still inconsistent outside recent finance/catalog work.
- Dependency audit still needs a dedicated upgrade/remediation pass.
- Lint warnings remain and should be cleaned before adopting a zero-warning policy.
- Webhook retry processing remains in-process; a dedicated worker/scheduler is a future operational improvement.

## Evidence Snapshot

Commands run on 2026-07-03:

```sh
npx prisma validate
npx prisma migrate status
npm run lint -- --format stylish
npx tsc --noEmit --pretty false
npm audit --omit=dev --audit-level=high
npm run build
```

Results:

- `npx prisma validate`: passed.
- `npx prisma migrate status`: passed; 13 migrations found; database schema is up to date.
- `npm run lint`: failed.
- `npx tsc --noEmit`: failed.
- `npm audit --omit=dev --audit-level=high`: failed.
- `npm run build`: passed, while reporting `Skipping validation of types` and `Skipping linting`.

Latest validation after stabilization:

- `npm run validate`: passed with 68 lint warnings.
- `npm run build`: passed with type and lint validation enabled.
- `npx prisma migrate status`: passed; 14 migrations found; database schema is up to date.

Repository inventory observed:

- API route handlers: 41.
- App pages: 59.
- Prisma migrations: 14.
- Documented module READMEs: 5.
- Current bounded contexts listed in architecture docs: 9.
- Working tree entries changed/untracked at time of report: 62.

## Progress Log

### 2026-07-03 Stabilization Phase 1 Started

Completed low-risk validation and Next.js compatibility cleanup:

- Added `src/generated/prisma/**` to ESLint ignores so generated Prisma output no longer dominates lint results.
- Added npm validation scripts:
  - `typecheck`
  - `prisma:validate`
  - `validate`
- Updated old Next 15 dynamic API route handler signatures to await `params` in:
  - `src/app/api/domains/[id]/route.ts`
  - `src/app/api/hosting/[id]/route.ts`
  - `src/app/api/notes/[id]/route.ts`
  - `src/app/api/proposals/[id]/send/route.ts`

Verification after this step:

- Scoped ESLint for edited route/config files: passed.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: still fails, but the previous dynamic route signature errors for the edited files are gone.
- `npm run lint`: still fails, but generated Prisma files are no longer the primary noise source.
- `npm run build`: passed, still with type/lint validation skipped by `next.config.ts`.

### 2026-07-03 Stabilization Phase 2 Continued

Completed another low-risk TypeScript cleanup cluster:

- Aligned admin user add/edit forms with Zod input/output typing for `react-hook-form`.
- Updated user creation validation so email is required and blank optional full-name input is normalized safely.
- Updated `/api/users` creation to persist a non-null `fullName`, falling back to `username` when the optional full-name field is empty.
- Replaced client-side use of the Prisma `Payment` model in `PaymentList` with an explicit API JSON DTO so `Decimal` and nullable date values are rendered/formatted safely.

Verification after this step:

- Scoped ESLint for edited user, validation, and payment-list files: passed.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: still fails, but user form/API and payment-list errors are gone.
- `npm run lint`: still fails with 33 errors and 69 warnings in pre-existing project-wide clusters.
- `npm run build`: passed, still with type/lint validation skipped by `next.config.ts`.

### 2026-07-03 Stabilization Phase 3 Continued

Completed the remaining non-webhook TypeScript cleanup:

- Updated daily cron and manual webhook retry payload construction to read hosting package labels from the current `Hosting.name` model field.
- Converted proposal PDF amount rendering from Prisma `Decimal` to a string/number before locale currency formatting.
- Added an explicit webhook log DTO type in the logs route to remove the route-local implicit `any`.

Verification after this step:

- Scoped ESLint for edited cron, webhook route, and proposal PDF files: passed.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: still fails only on `src/lib/webhook-config.ts` because `WebhookLog` and `WebhookQueue` Prisma models do not exist yet.
- `npm run lint`: still fails with 33 errors and 69 warnings in project-wide lint clusters unrelated to this TypeScript pass.
- `npm run build`: passed, still with type/lint validation skipped by `next.config.ts`.

### 2026-07-03 Stabilization Phase 4 Continued

Cleared the remaining project-wide ESLint errors without changing application behavior:

- Kept CommonJS runtime scripts as CommonJS and added narrow lint exceptions for `require` usage in seed/healthcheck scripts.
- Replaced route/component `any` catches with `unknown` plus explicit fallback error messages.
- Replaced client-side `any` casts in application, domain, hosting, product stock, and product group UI code with local DTO or schema-derived types.
- Replaced JSX text quoting that violated `react/no-unescaped-entities`.
- Removed obsolete `@ts-ignore` comments around `prisma.setting`, which is present in the generated Prisma client.

Verification after this step:

- Scoped ESLint for edited lint-cleanup files: passed with warnings only.
- `npm run lint`: passed; 0 errors, 68 warnings remain.
- `npm run typecheck`: still fails only on `src/lib/webhook-config.ts` because `WebhookLog` and `WebhookQueue` Prisma models do not exist yet.
- `npm run build`: passed, still with type/lint validation skipped by `next.config.ts`.

### 2026-07-03 Stabilization Phase 5 Continued

Closed the webhook persistence and build-gate cluster:

- Added `WebhookLog` and `WebhookQueue` Prisma models.
- Added migration `20260703020000_add_webhook_persistence`.
- Made the migration idempotent for existing development databases that already had early webhook tables without the final columns.
- Centralized webhook delivery through timeout-aware `postWebhook`.
- Added idempotent retry queue behavior with `WebhookQueue.dedupeKey`.
- Fixed retry log IDs so repeated attempts do not collide on the log primary key.
- Added ADR 0005 and the Webhook Operations runbook.
- Removed `next.config.ts` type/lint build bypasses.

Verification after this step:

- `npx prisma migrate deploy`: applied the webhook persistence migration after resolving the earlier failed local attempt as rolled back.
- `npx prisma migrate status`: passed; database schema is up to date.
- `npm run validate`: passed with 68 lint warnings.
- `npm run build`: passed with type and lint validation enabled.

## Key Findings

### Resolved P0: Build Validation Bypass Removed

Previous impact:

- Production build can pass with invalid route handler signatures, missing Prisma models, and UI type errors.
- Operators may trust a successful Docker/Next build even when the code is not type-safe.
- ESLint warnings can be hidden if lint is skipped during build.

Current state:

- `next.config.ts` no longer skips TypeScript or ESLint build validation.
- `npm run typecheck` passes.
- `npm run lint` passes with 68 warnings.
- `npm run build` runs lint/type validation and passes.

Recommended direction:

1. Reduce lint warnings in low-risk batches.
2. Decide whether warnings should become build-blocking later.
3. Keep `npm run validate` in the regular pre-deploy checklist.

### Resolved P0: Webhook Persistence Contract Added

Previous code references:

- `prisma.webhookLog`
- `prisma.webhookQueue`

These now map to `WebhookLog` and `WebhookQueue` models.

Related files:

- `src/lib/webhook-config.ts`
- `src/app/api/system/webhooks/route.ts`
- `src/app/api/system/webhooks/logs/route.ts`
- `src/app/api/system/webhooks/queue/route.ts`
- `src/app/api/system/webhooks/retry/route.ts`
- `src/app/api/cron/daily/route.ts`

Recommended direction:

- Preserve ADR 0005 invariants when changing webhook behavior.
- Move retry processing to a dedicated worker or scheduler when deployment topology requires it.
- Protect cron/webhook admin operations behind a signed trigger or route-local admin auth contract.

### P0: API Authorization Is Inconsistent Outside Recent Finance Work

Recent routes use `src/lib/api-auth.ts`, but many API routes do not contain route-local auth checks.

Unauthenticated or helper-less candidates observed:

- `src/app/api/cron/daily/route.ts`
- `src/app/api/domains/route.ts`
- `src/app/api/domains/[id]/route.ts`
- `src/app/api/hosting/route.ts`
- `src/app/api/hosting/[id]/route.ts`
- `src/app/api/notes/route.ts`
- `src/app/api/notes/[id]/route.ts`
- `src/app/api/proposals/route.ts`
- `src/app/api/proposals/[id]/route.ts`
- `src/app/api/proposals/[id]/send/route.ts`
- `src/app/api/proposals/[id]/pdf/route.ts`
- `src/app/api/settings/route.ts`
- `src/app/api/settings/[id]/route.ts`
- `src/app/api/settings/seed/route.ts`
- `src/app/api/subscriptions/[id]/proposal-type/route.ts`
- `src/app/api/system/webhooks/*`
- `src/app/api/tasks/route.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/users/route.ts`
- `src/app/api/users/[id]/route.ts`

Middleware currently gives broad `/api/*` rate limiting, but route-local auth is only explicit for selected domains.

Recommended direction:

- Create a public API allowlist.
- Require route-local auth for all non-public APIs.
- Treat `/api/health` and `/api/auth/login` as public.
- Treat cron/webhook admin operations as protected unless a signed external trigger contract is documented.

### P0: Dependency Audit Has Critical Findings

`npm audit --omit=dev --audit-level=high` reported:

- 1 critical vulnerability.
- 5 high vulnerabilities.
- 3 moderate vulnerabilities.

Important packages involved:

- `next`
- `prisma`
- `next-auth`
- `uuid`
- transitive packages including `effect`, `defu`, `preact`, `postcss`

Recommended direction:

- Do not run `npm audit fix --force` blindly.
- Create a dependency-upgrade branch.
- Upgrade Next.js and related packages with a full type/lint/build/Playwright smoke pass.
- Record dependency upgrade and any behavior changes in `CHANGELOG.md`.

### P1: Legacy Authentication Surface Still Exists

`src/lib/auth.ts` contains hard-coded `admin/admin123` credentials and sessionStorage-based auth helpers.

`src/app/admin/login/page.tsx` imports this legacy helper, while the active application login uses:

- `src/app/login/page.tsx`
- `src/app/api/auth/login/route.ts`
- database-backed `User` rows
- `auth-token` and `role` cookies

Impact:

- Future maintainers may mistake the legacy admin login as supported auth.
- Hard-coded credentials should not remain in production code, even if the route is effectively displaced by middleware.
- Identity model ownership is unclear because both `Admin` and `User` models exist, while active login uses `User`.

Recommended direction:

- Redirect or remove `/admin/login`.
- Delete `src/lib/auth.ts` after verifying no supported flow uses it.
- Document the accepted Identity And Access module contract.
- Decide whether the `Admin` Prisma model is legacy or future-owned.

### P1: Cron Route Uses GET For Mutating Work

`src/app/api/cron/daily/route.ts`:

- marks late payments;
- expires subscriptions;
- sends webhook payloads;
- starts the webhook retry processor.

Impact:

- GET request semantics hide mutations.
- Auth/signature requirements are not documented in a runbook.
- Retrying or crawling the endpoint can trigger operational side effects.

Recommended direction:

- Move to a signed `POST` cron contract.
- Add timeout and idempotency guidance.
- Add a Notifications And Webhooks module README and runbook before expanding this area.

### P1: Documentation Coverage Is Uneven

Module READMEs exist for:

- Accounting And Finance.
- Customer Management.
- Products And Stock.
- Proposals And Sales.

Missing module READMEs remain for:

- Identity And Access.
- Subscription And Renewal Management.
- Domain And Hosting Operations.
- Notifications And Webhooks.
- Settings.
- Tasks/Support, if treated as a durable context.
- Files/Uploads, if treated as a durable context.

README status:

- Root `README.md` still mostly contains default Next.js boilerplate.
- It does not yet explain the AI Project Operating System, required reading order, local setup, validation commands, default login contract, or module map.

Recommended direction:

- Replace root README boilerplate with project-specific contributor and operator guidance.
- Add missing module READMEs before touching those modules.

### P1: Route Topology Has Legacy And Duplicate Surfaces

Observed route families include:

- `/admin/customers/*`
- `/customers/*`
- `/admin/users/*`
- `/users/*`
- `/login`
- `/admin/login`
- `/admin/accounting/customers/*` compatibility redirects

Some legacy routes are intentional compatibility redirects, but not all route duplication is clearly documented.

Recommended direction:

- Create a route inventory table.
- Mark each route as primary, compatibility redirect, public, admin-only, portal-only, or deprecated.
- Remove or redirect ambiguous legacy routes in small commits.

### P1: Full ESLint Fails, Partly Because Generated Prisma Is Not Ignored

`src/generated/prisma` is ignored by git but not ignored by ESLint.

Impact:

- Full lint output is dominated by generated files, which hides real application lint issues.
- Application lint issues still exist after excluding generated noise, including `any`, unescaped text, hook dependency suppressions, and CommonJS `require` usage.

Recommended direction:

- Add `src/generated/prisma/**` to ESLint ignores.
- Then fix application lint errors by module, not as one sweeping refactor.

### P1: Test Coverage Is Essentially Absent

No project-owned test files were found outside `node_modules`.

Impact:

- Financial correctness is currently guarded by manual/API/Playwright checks, not repeatable regression tests.
- This increases risk when cleaning route auth, direct sale, payment ledger, or subscription schedule behavior.

Recommended direction:

- Add a minimal regression harness for high-risk server contracts first:
  - payment `PAID` -> `PAYMENT_CREDIT`;
  - direct sale idempotency;
  - service sale without stock movement;
  - invoice issue stock rollback;
  - API auth allow/deny behavior.

### P2: Type Escape Hatches And Data Shape Drift

Examples:

- `src/lib/settings.ts` uses multiple `@ts-ignore`.
- Domain/hosting components use `any` casts.
- Cron/webhook routes cast Date fields through `as unknown as string`.
- `payment-list` and PDF generation have Decimal/date type mismatches.

Recommended direction:

- Introduce small local response types per API route or shared DTOs where already repeated.
- Remove `@ts-ignore` only after the underlying Prisma/settings contract is clear.

### P2: Operational Health Check Mutates Filesystem

`src/app/api/health/route.ts` creates `public/uploads` when missing.

Impact:

- Health checks ideally verify readiness, not repair filesystem state.
- In read-only or restricted runtimes, the health endpoint can fail for reasons unrelated to app/database readiness.

Recommended direction:

- Decide whether uploads directory creation belongs in startup, deployment, or health.
- Keep health read-only unless a runbook explicitly permits self-healing behavior.

## Recommended Low-Risk Stabilization Sequence

### Phase 0: Stabilization Branch And Checkpoint

Goal: preserve current working state before cleanup.

Actions:

- Create a stabilization branch.
- Review the 62 changed/untracked entries.
- Commit or otherwise checkpoint the current functional state before broad cleanup.
- Do not mix new product features into this branch.

Rollback:

- Return to the checkpoint commit.

### Phase 1: Make Validation Signals Trustworthy

Goal: reduce noise without changing runtime behavior.

Actions:

- Add `src/generated/prisma/**` to ESLint ignores.
- Add explicit scripts:
  - `typecheck`
  - `lint`
  - `validate`
  - optionally `healthcheck:local`
- Keep `ignoreBuildErrors` and `ignoreDuringBuilds` for now, but document them as temporary.

Rollback:

- Revert validation config/script changes.

### Phase 2: Fix TypeScript Errors By Cluster

Goal: get `npx tsc --noEmit` green with minimal behavioral change.

Actions:

- Update old Next 15 dynamic route handler signatures.
- Fix user add/edit form resolver types.
- Fix Decimal/date rendering types in payment/PDF code.
- Fix `hosting.package` references.
- Decide webhook model direction before touching webhook type errors.

Rollback:

- Revert the specific cluster commit.

### Phase 3: API Auth Inventory And Allowlist

Goal: ensure every API route is either public by design or route-authenticated.

Actions:

- Add an Identity And Access module README.
- Define public endpoints:
  - likely `/api/auth/login`;
  - likely `/api/health`;
  - any public application endpoint by explicit decision.
- Add `requireAdminApi` or `requireAuthenticatedApi` to non-public APIs.
- Add a small auth smoke test script or Playwright/API checklist.

Rollback:

- Revert per-domain auth commits if a legitimate flow is blocked.

### Phase 4: Webhook And Cron Decision

Goal: stop having partial integration architecture.

Actions:

- Add ADR for Notifications And Webhooks if keeping the feature.
- Add missing Prisma models and migration for webhook logs/queue, or remove/disable the UI/routes.
- Convert daily cron to signed/idempotent `POST`.
- Add timeout handling and retry runbook.

Rollback:

- Disable webhook/cron admin UI and API routes until contract is restored.

### Phase 5: Route Topology Cleanup

Goal: one clear route map.

Actions:

- Create route inventory documentation.
- Redirect or remove `/admin/login` legacy auth page.
- Decide fate of root `/customers/*` and `/users/*` routes.
- Keep compatibility redirects only where documented.

Rollback:

- Restore redirects for any operator-facing bookmarked routes.

### Phase 6: Documentation Completion

Goal: make repository memory complete enough for future AI agents.

Actions:

- Replace root README boilerplate with project-specific setup and validation docs.
- Add missing module READMEs.
- Add runbooks for:
  - Identity/session troubleshooting;
  - Webhook/cron operations;
  - Upload storage and restore, if uploads remain in scope.

Rollback:

- Docs-only changes can be amended without runtime rollback.

### Phase 7: Dependency Upgrade

Goal: close security advisories without destabilizing product behavior.

Actions:

- Upgrade Next.js and related packages on a dedicated branch.
- Avoid `npm audit fix --force` unless the dependency tree impact is reviewed.
- Run full validation and browser smoke tests.
- Update changelog.

Rollback:

- Revert dependency upgrade commit and package lock changes.

## Suggested Immediate Next Task

Start with Phase 1 and the low-risk subset of Phase 2:

1. Add ESLint ignore for generated Prisma files.
2. Add `typecheck` and `validate` scripts.
3. Fix old Next 15 route handler signatures in:
   - domains;
   - hosting;
   - notes;
   - proposal send.
4. Run:
   - `npx prisma validate`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`

This is low risk because it should not change business behavior.

## Knowledge Capture Evaluation

- Constitution change needed: no.
- ADR needed now: no for this report. An ADR will be needed before webhook/cron contract changes.
- Runbook update needed now: no behavior changed. Future auth/webhook/cron work needs runbooks.
- Changelog update needed: yes, document this maintenance report.
- Architecture assumptions changed: no; gaps were identified.
- Operational behavior changed: no.
