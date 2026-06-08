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

- `docker-compose-deployment.md`: Production Docker Compose build, migration, startup, and health verification.

Known candidates:

- Webhook queue and retry operations
- Daily cron execution
- Authentication/session troubleshooting
- Invoice/payment reconciliation
