# Notifications And Webhooks Module

## Ownership

This module owns outbound operational notifications and webhook delivery infrastructure.

It includes:

- Webhook configuration.
- Daily cron webhook event delivery.
- Webhook delivery logs.
- Webhook retry queue.
- Webhook queue health visibility.

## Primary Code Areas

- `src/lib/webhook-config.ts`
- `src/app/api/system/webhooks/`
- `src/app/api/cron/daily/`
- `src/app/admin/settings/webhooks/`
- `prisma/schema.prisma`
  - `WebhookLog`
  - `WebhookQueue`

## Responsibilities

- Send configured webhook events as JSON `POST` requests.
- Add HMAC signatures when `WEBHOOK_SECRET` is configured.
- Apply webhook request timeout handling.
- Persist every delivery attempt in `WebhookLog`.
- Persist failed retries in `WebhookQueue`.
- Avoid duplicate retry jobs for the same `event/url/body`.
- Expose queue/log state for operators.

## Non-Responsibilities

- Owning the business truth for event payloads.
- Creating financial, sales, stock, or customer state.
- Hiding failed deliveries from operators.
- Silently deleting webhook history.

## Dependencies

- Prisma/PostgreSQL persistence.
- Daily cron flow for scheduled events.
- Event-owning contexts for payload content:
  - Accounting And Finance for payment due data.
  - Customer Management for customer identifiers in payloads.
  - Domains/Hosting/Subscriptions for expiring service data.

## Operational Contract

- First delivery happens inline during cron/manual trigger.
- Failed deliveries are queued for retry.
- Retry queue dedupe is keyed by `event/url/body`.
- Default webhook timeout is 10 seconds via `WEBHOOK_TIMEOUT_MS`.
- Retry behavior and recovery steps are defined in `docs/40-runbooks/webhook-operations.md`.
- Architectural decision is recorded in ADR 0005.

## Rollback Notes

- Stop webhook triggers before reverting code.
- Preserve `webhook_logs` for audit and incident analysis.
- Delete only specific harmful `webhook_queue` rows after recording the reason.
- Keep the persistence migration unless a deliberate database rollback is planned.
