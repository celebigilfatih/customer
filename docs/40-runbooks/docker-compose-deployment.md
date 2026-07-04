# Docker Compose Deployment Runbook

This runbook covers the production Docker Compose path defined in `docker-compose.yml`.

## Bounded Contexts

- Deployment and runtime operations
- Database migration lifecycle
- Health verification

## Services

- `postgres`: PostgreSQL database exposed on host port `5451`.
- `app`: Next.js standalone runner exposed on host port `3002`.

## Startup Flow

The Docker image default command runs:

```sh
npx prisma migrate deploy && node server.js
```

`docker-compose.yml` should not need to override this command unless a deployment target has a special startup requirement.

The production image must include:

- Generated Prisma client
- Prisma schema and migrations
- Prisma CLI runtime dependencies
- Next.js standalone output
- `curl` for Dockerfile-based platform healthchecks such as Coolify

Do not rely on runtime package downloads inside the container. The image should contain the dependencies required to run migrations before the server starts.

## Build And Start

```sh
npm run validate
npm run build
npm audit --audit-level=critical
docker compose build app
docker compose up -d
```

Expected result:

- All Prisma migrations apply successfully on a fresh database.
- The app starts `node server.js`.
- `GET http://localhost:3002/api/health` returns HTTP 200.
- Docker health eventually reports the `app` container as healthy after the healthcheck interval.

Do not expose a public production deployment while `npm audit --audit-level=critical` reports critical runtime vulnerabilities. As of the Hostinger/Coolify preparation on 2026-07-03, the repository still reports a critical Next.js advisory and should receive a dependency-upgrade pass before public exposure.

## Coolify Deployment

Recommended Coolify setup:

- Create the application from the Git repository inside the existing Coolify project, such as `Aidat_takip`.
- Select the Dockerfile build pack.
- Expose container port `3000`.
- Attach the application to the existing Coolify PostgreSQL resource by setting `DATABASE_URL` to the PostgreSQL internal connection string.
- Set `NEXTAUTH_URL` to the public HTTPS URL of the app.
- Set `NEXTAUTH_SECRET` to a long random secret.
- Add persistent storage for `/app/public/uploads` if uploads must survive redeploys.
- Prefer the Dockerfile custom healthcheck; the image contains `curl` and checks `http://127.0.0.1:3000/api/health`.
  Do not enable the Coolify UI healthcheck unless intentionally replacing the image healthcheck.

The image startup command already runs `npx prisma migrate deploy && node server.js`, so Coolify does not need a custom start command for normal deployments.

Do not deploy the repository `postgres` compose service to Coolify when using an already-installed PostgreSQL resource. That would create a duplicate database.

For Hostinger/Coolify deployments that reuse an existing PostgreSQL resource, create a separate database for this application before the first deploy. Do not point `DATABASE_URL` at an existing application database. Recommended database name:

```text
customer_webmahsul
```

Required Coolify environment variables:

```env
DATABASE_URL=postgresql://USER:PASSWORD@INTERNAL_POSTGRES_HOST:5432/customer_webmahsul?schema=public
NEXTAUTH_URL=https://YOUR_PUBLIC_APP_DOMAIN
NEXTAUTH_SECRET=LONG_RANDOM_SECRET
NODE_ENV=production
```

`DATABASE_URL` must exist before deployment starts because the container startup command runs Prisma migrations before starting the Next.js server.

### Persistent Upload Storage

If uploads must survive redeploys, add a Coolify persistent storage volume or bind mount with this destination path:

```text
/app/public/uploads
```

Do not mount over `/app` or `/app/public`; only mount the uploads directory.

### Initial Admin Bootstrap

Production login does not create a default `admin/admin` user. After the first successful deployment and migration, open the Coolify container terminal for the application and run:

```sh
ADMIN_USERNAME=admin \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='replace-with-a-long-random-password' \
ADMIN_FULL_NAME='Admin User' \
node scripts/create-admin.mjs
```

Requirements:

- `ADMIN_PASSWORD` must be at least 12 characters.
- If an admin already exists, the script exits without changing that account.
- The script must not be used to reset a production password silently.
- Store the real production password in a password manager; do not commit it or write it into this repository.

### Local Database Restore To Coolify

Use this flow when intentionally replacing the Coolify production database with a local database snapshot.

Required safeguards:

- Stop the application container before restoring the database.
- Create a separate production backup database first.
- Restore only into the application database, such as `customer_webmahsul`.
- Confirm the application is deployed and healthy after restore.
- Recreate or verify the intended production admin account because the restored local `users` table replaces production users.

Example backup command from the Coolify PostgreSQL terminal:

```sh
createdb -U postgres customer_webmahsul_backup_YYYYMMDD_HHMMSS
pg_dump -U postgres -d customer_webmahsul --clean --if-exists --no-owner --no-privileges \
  | psql -U postgres -d customer_webmahsul_backup_YYYYMMDD_HHMMSS
```

Recommended restore path:

1. Export the local database with `pg_dump --format=custom`.
2. Open the Coolify PostgreSQL resource `Import Backup` page.
3. Set the custom import command to target the application database explicitly:

   ```sh
   pg_restore -U $POSTGRES_USER --clean --if-exists --no-owner --no-privileges -d customer_webmahsul
   ```

4. Upload the custom-format dump file and confirm the destructive restore.
5. Verify core row counts from the Coolify database terminal.
6. Recreate or verify the production admin account.
7. Deploy or restart the application and confirm `/api/health` reports `database: connected` and `uploads: accessible`.

For the 2026-07-04 restore, the pre-restore production backup database was:

```text
customer_webmahsul_backup_20260704_113338
```

## Verification

```sh
docker compose ps
docker logs omt-app --tail 200
curl -i http://localhost:3002/api/health
```

Healthy response example:

```json
{
  "status": "healthy",
  "database": "connected",
  "uploads": "accessible"
}
```

Coolify verification after deployment:

1. Confirm deployment logs contain successful Prisma migration output, such as `No pending migrations to apply.` or applied migration names.
2. Confirm `node server.js` starts after migration.
3. Visit `https://YOUR_PUBLIC_APP_DOMAIN/api/health` and confirm `status`, `database`, and `uploads` are healthy.
4. Create the initial admin user with `node scripts/create-admin.mjs`.
5. Sign in through `/login` and smoke test `/admin/dashboard`, `/admin/customers`, `/admin/finance`, `/admin/domains`, and `/admin/hosting`.
6. Upload a test file and redeploy once to confirm `/app/public/uploads` persistence.

## Common Failures

### `@prisma/client did not initialize yet`

Cause:

- Application code imports `@prisma/client` while Prisma client is generated to `src/generated/prisma`.

Resolution:

- Runtime application code must import Prisma runtime values from `@/generated/prisma`.

### `npx prisma migrate deploy` tries to install Prisma

Cause:

- The standalone runner image does not contain Prisma CLI dependencies.

Resolution:

- Copy `node_modules` from the builder stage into the runner image, or otherwise ensure all Prisma CLI dependencies are present.

### `Environment variable not found: DATABASE_URL`

Cause:

- Coolify application environment variables do not include `DATABASE_URL`.
- The app was not attached to the existing Coolify PostgreSQL resource.
- The PostgreSQL connection string was added to the database resource but not to the application.

Resolution:

- In the Coolify application, add `DATABASE_URL` using the PostgreSQL internal connection string.
- Redeploy after saving environment variables.
- Check deployment logs for `No pending migrations to apply.` or applied migration names.

### Login returns `İlk yönetici kullanıcı oluşturulmamış`

Cause:

- The production database has no users.
- Production auto-creation of `admin/admin` is disabled by design.

Resolution:

- Run the initial admin bootstrap command from the Coolify container terminal with `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optional `ADMIN_FULL_NAME`.
- Retry login with the created admin credentials.

### `EACCES: permission denied, open '/app/prisma/schema.prisma'`

Cause:

- The runner executes as the `nextjs` user but Prisma files were copied as unreadable root-owned files.

Resolution:

- Copy Prisma files and runtime dependencies with `--chown=nextjs:nodejs`.

### Docker healthcheck is unhealthy while `/api/health` is healthy

Cause:

- The healthcheck script may resolve `localhost` to IPv6 `::1` while the app listens on IPv4 `0.0.0.0`.
- The healthcheck script may not be readable by the non-root runtime user.
- Dockerfile-based platforms such as Coolify may require `curl` or `wget` to be present in the image.

Resolution:

- Use `127.0.0.1` in healthcheck commands.
- Install `curl` in the runner image.
- Copy the healthcheck script with `--chown=nextjs:nodejs`.

### Migration fails on fresh database because a table does not exist

Cause:

- Migration ordering or assumptions do not match a fresh database lifecycle.

Resolution:

- Make earlier compatibility migrations safe when their target table does not exist.
- Ensure later init migrations create tables matching the current Prisma schema.
- Validate with a fresh Compose volume before closing the task.

## Rollback

For image/package changes, revert the Dockerfile change and rebuild the image.

For migration changes, do not blindly edit already-applied production migrations. If production databases have applied a different migration history, create a forward corrective migration and document it with an ADR or runbook note.

For Hostinger/Coolify deployments using an existing PostgreSQL resource:

- Roll back the application image through Coolify if the container fails after deployment.
- Do not point a rollback at another application's database.
- Preserve the separate `customer_webmahsul` database for incident analysis unless an explicit database restore is planned.
- If a local-to-production restore must be reverted, restore from the pre-restore backup database using the same `pg_restore`/`psql` discipline and document the corrective action.
- Upload storage is independent of image rollback and should not be deleted during ordinary rollback.
