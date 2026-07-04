# Runbooks

Runbooks document operational procedures, verification steps, recovery steps, and incident handling.

Add or update a runbook when a task changes:

- Integration behavior
- Webhook delivery
- Queue/retry behavior
- Authentication/session cleanup
- Health checks
- Scheduled jobs
- Financial mutation or reconciliation behavior
- Deployment, backup, restore, or rollback steps

## Current Runbook Index

- `accounting-finance-operations.md`: Payment ledger, invoice issue, subscription schedule, auth, and recovery checks.
- `docker-compose-deployment.md`: Production Docker Compose/Coolify build, PostgreSQL migration, admin bootstrap, upload persistence, startup, and health verification.
- `webhook-operations.md`: Webhook delivery, logs, queue retry, timeout, and rollback checks.

Known candidates:

- Daily cron execution
- Authentication/session troubleshooting
