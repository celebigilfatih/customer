# ADR 0005: Webhook Persistence And Retry Contract

Date: 2026-07-03

## Status

Accepted

## Context

Webhook delivery existed in code but referenced `prisma.webhookLog` and `prisma.webhookQueue` without matching Prisma models. Because production builds skipped type validation, this mismatch could remain hidden until runtime.

Webhook delivery is an integration boundary. It needs durable logs, retry/backoff, timeout handling, health visibility, and idempotent queue behavior.

## Decision

Webhook delivery persistence is now owned by two Prisma models:

- `WebhookLog`: append-only delivery attempt records for event, URL, success/failure, status/error, attempt number, and timestamp.
- `WebhookQueue`: durable retry queue for failed deliveries.

Retry queue idempotency is enforced by `WebhookQueue.dedupeKey`, derived from `event`, `url`, and serialized request body. Re-enqueueing the same failed delivery updates the existing queued job instead of creating duplicates.

Webhook HTTP delivery is centralized through `postWebhook`:

- Sends JSON `POST` requests.
- Adds `X-Webhook-Signature` HMAC-SHA256 when a secret exists.
- Applies a timeout controlled by `WEBHOOK_TIMEOUT_MS`, defaulting to 10 seconds.

Retry timing remains:

- Inline first delivery happens during cron/manual trigger.
- Failed delivery is queued as attempt 2.
- Attempt 2 waits 5 minutes.
- Attempt 3 waits 30 minutes.
- Jobs are removed after attempt 3 succeeds or permanently fails.

The current retry processor is still in-process and starts when webhook cron/retry flows call `startWebhookRetryProcessor`. A separate worker or scheduler may replace this later, but must preserve the same persisted queue contract.

## Consequences

- `npm run typecheck` can validate webhook persistence against Prisma.
- Production build no longer needs to skip type or lint validation.
- Operators can inspect logs and queue state from durable database tables.
- Duplicate cron/manual failures for the same payload no longer multiply queue rows.
- Existing development databases with early webhook tables are handled by an idempotent migration that adds missing columns without deleting data.

## Operational Invariants

- Every delivery attempt must write a `WebhookLog` row.
- Failed deliveries that should retry must have at most one `WebhookQueue` row per `event/url/body`.
- Webhook requests must use the centralized timeout-aware sender.
- Queue rows must be removed after success or final failure.
- Logs are operational history and must not be silently deleted during incident response.

## Rollback

If webhook persistence causes an incident:

1. Stop triggering `/api/cron/daily` and manual webhook retry actions.
2. Preserve affected `webhook_logs` and `webhook_queue` IDs.
3. Revert application code if needed, but keep the migration unless a database rollback is explicitly planned.
4. If a queued payload is harmful, delete only the specific `webhook_queue` row after recording its payload and reason.
5. Re-run `npm run validate` and `npm run build` before restoring webhook delivery.
