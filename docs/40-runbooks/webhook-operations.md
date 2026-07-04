# Webhook Operations Runbook

## Purpose

Use this runbook when investigating daily cron webhook delivery, manual webhook retries, failed webhook payloads, or queue growth.

## Health Checks

- `npm run validate` must pass.
- `npm run build` must run type and lint validation; it must not print `Skipping validation of types` or `Skipping linting`.
- `npx prisma migrate status` must report the database schema is up to date.
- Database tables must exist:
  - `webhook_logs`
  - `webhook_queue`
- `/api/system/webhooks/queue` should return:
  - `pending`
  - `nextInMs`
- `/api/system/webhooks/logs` should return recent delivery attempts.

## Configuration

- `WEBHOOK_URLS`: comma-separated target URLs.
- `WEBHOOK_SECRET`: optional HMAC secret.
- `WEBHOOK_TIMEOUT_MS`: optional request timeout in milliseconds; default is 10000.

When `WEBHOOK_SECRET` exists, outgoing deliveries include `X-Webhook-Signature`.

## Retry Behavior

- The first delivery attempt happens inline during `/api/cron/daily` or manual retry.
- A failed inline delivery queues attempt 2.
- Attempt 2 waits 5 minutes.
- Attempt 3 waits 30 minutes.
- Queue rows are removed after success or final failure.
- Duplicate failures for the same `event/url/body` update the existing queue row through `dedupeKey` and must not create duplicate rows.

## Verification Queries

Use any trusted SQL client or Prisma inspection script.

Recent failures:

```sql
SELECT id, event, url, statusCode, error, attempt, timestamp
FROM webhook_logs
WHERE ok = false
ORDER BY timestamp DESC
LIMIT 50;
```

Pending queue:

```sql
SELECT id, event, url, attempt, nextAt, createdAt, updatedAt
FROM webhook_queue
ORDER BY nextAt ASC
LIMIT 50;
```

Duplicate protection check:

```sql
SELECT "dedupeKey", COUNT(*)
FROM webhook_queue
GROUP BY "dedupeKey"
HAVING COUNT(*) > 1;
```

Expected result: no rows.

## Incident Response

If webhooks are failing:

1. Check whether the target URL is reachable outside the app.
2. Check `webhook_logs.error` and `statusCode`.
3. Check whether failures are timeouts; adjust `WEBHOOK_TIMEOUT_MS` only if the target is expected to respond slowly.
4. Check queue growth with `/api/system/webhooks/queue`.
5. Retry a single event manually before retrying batches.

If a queued payload is harmful:

1. Record `webhook_queue.id`, `event`, `url`, and a redacted copy of `body`.
2. Delete only the affected queue row.
3. Keep related `webhook_logs` rows for audit history.
4. Document the deletion reason in the incident notes.

If the retry processor is not draining:

1. Trigger `/api/cron/daily` or a manual retry to start the in-process retry processor.
2. Verify `nextInMs` decreases or ready rows are attempted.
3. If running in a multi-process/serverless environment, plan a dedicated worker or scheduled processor that preserves ADR 0005.

## Rollback

- Disable webhook triggers before reverting code.
- Do not drop `webhook_logs` during rollback.
- Prefer deleting specific harmful queue rows over truncating `webhook_queue`.
- After rollback or fix, run:
  - `npx prisma migrate status`
  - `npm run validate`
  - `npm run build`
