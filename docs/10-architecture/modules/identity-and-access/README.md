# Identity And Access

## Ownership

Identity And Access owns application login, user roles, session cookies, admin/customer access checks, and first-admin bootstrap rules.

## Boundaries

Owned implementation areas:

- `src/app/api/auth/`
- `src/app/login/`
- `src/app/admin/login/`
- `src/lib/auth.ts`
- `src/middleware.ts`
- `scripts/create-admin.mjs`

Non-responsibilities:

- Customer billing rules
- Subscription lifecycle rules
- Proposal approval rules
- Financial ledger correctness

## Production Bootstrap

Production must not create a default `admin/admin` user during login.

The first production admin is created after database migration with:

```sh
ADMIN_USERNAME=admin \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='replace-with-a-long-random-password' \
ADMIN_FULL_NAME='Admin User' \
node scripts/create-admin.mjs
```

The script is idempotent for bootstrap: if an admin already exists, it exits without changing credentials.

Development may auto-create `admin/admin` only when:

```env
ALLOW_DEV_AUTO_ADMIN=true
```

and `NODE_ENV` is not `production`.

## Operational Risks

- A production database with no admin user cannot be accessed until `scripts/create-admin.mjs` runs.
- Admin bootstrap credentials must be passed through environment variables and stored outside the repository.
- Password reset and multi-admin management should happen through explicit user-management workflows, not hidden login side effects.

## Rollback Notes

- If login fails after deployment because no admin exists, run the bootstrap script instead of re-enabling default credentials.
- If a bootstrap command was run with the wrong email or username before any business data exists, correct it through the admin/user management workflow or a deliberate database correction with an audit note.
