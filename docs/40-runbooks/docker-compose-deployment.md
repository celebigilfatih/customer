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

Do not rely on runtime package downloads inside the container. The image should contain the dependencies required to run migrations before the server starts.

## Build And Start

```sh
docker compose build app
docker compose up -d
```

Expected result:

- All Prisma migrations apply successfully on a fresh database.
- The app starts `node server.js`.
- `GET http://localhost:3002/api/health` returns HTTP 200.
- Docker health eventually reports the `app` container as healthy after the healthcheck interval.

## Coolify Deployment

Recommended Coolify setup:

- Create the application from the Git repository.
- Select the Dockerfile build pack.
- Expose container port `3000`.
- Attach the application to the existing Coolify PostgreSQL resource by setting `DATABASE_URL` to the PostgreSQL internal connection string.
- Set `NEXTAUTH_URL` to the public HTTPS URL of the app.
- Set `NEXTAUTH_SECRET` to a long random secret.
- Add persistent storage for `/app/public/uploads` if uploads must survive redeploys.

The image startup command already runs `npx prisma migrate deploy && node server.js`, so Coolify does not need a custom start command for normal deployments.

Do not deploy the repository `postgres` compose service to Coolify when using an already-installed PostgreSQL resource. That would create a duplicate database.

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

### `EACCES: permission denied, open '/app/prisma/schema.prisma'`

Cause:

- The runner executes as the `nextjs` user but Prisma files were copied as unreadable root-owned files.

Resolution:

- Copy Prisma files and runtime dependencies with `--chown=nextjs:nodejs`.

### Docker healthcheck is unhealthy while `/api/health` is healthy

Cause:

- The healthcheck script may resolve `localhost` to IPv6 `::1` while the app listens on IPv4 `0.0.0.0`.
- The healthcheck script may not be readable by the non-root runtime user.

Resolution:

- Use `127.0.0.1` in the healthcheck script.
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
