# Backend AGENTS.md - Medusa Runtime and Module Compliance

Scope: `apps/backend`, the Medusa v2 backend, Admin runtime, custom modules, providers, routes, subscribers, jobs, migrations, and backend scripts.

Read `../../AGENTS.md` and `../../README.md` before changing backend architecture, Docker runtime behavior, auth, payment, notification, file, cache, event bus, workflow, or locking behavior.

## Security Baseline

- Never commit real `apps/backend/.env` values or secrets.
- Never log `JWT_SECRET`, `COOKIE_SECRET`, SMTP credentials, PayPal secrets, bearer tokens, session cookies, reset tokens, or webhook signatures.
- Diagnostics may report whether a required env exists, but must not print secret values.
- Keep backend-only secrets out of storefront code and browser bundles.
- Do not weaken CORS, auth, secure cookies, or token validation.
- Do not patch `node_modules`, generated `.medusa` output, or Medusa internals.

## Required Medusa Conventions

- `pnpm --filter @dtc/backend build` runs `medusa build`.
- `pnpm --filter @dtc/backend start` runs `medusa start`.
- `pnpm --filter @dtc/backend predeploy` runs `medusa db:migrate`.
- `pnpm --filter @dtc/backend seed` runs `medusa exec ./src/migration-scripts/initial-data-seed.ts`.
- Register modules/providers through `medusa-config.ts` using documented Medusa module provider shapes.
- Keep module options env-driven. No hardcoded public origins, private origins, credentials, or fallback secrets.
- Do not disable Admin in production.

## Backend Env Reference

Backend env belongs in `apps/backend/.env`. Templates may live beside it. Real values must stay local.

Public backend/admin origins:

- `PUBLIC_BACKEND_URL`
- `MEDUSA_BACKEND_URL`
- `MEDUSA_ADMIN_BACKEND_URL`
- `PUBLIC_ASSET_BASE_URL`

Database and Redis:

- `DATABASE_URL`
- `REDIS_URL`
- `CACHE_REDIS_URL`
- `LOCKING_REDIS_URL`

CORS and auth:

- `STORE_CORS`
- `ADMIN_CORS`
- `AUTH_CORS`
- `JWT_SECRET`
- `COOKIE_SECRET`

Operational:

- `DISABLE_MEDUSA_ADMIN`
- `MEDUSA_WORKER_MODE`
- `PORT`
- `MEDUSA_ADMIN_ONBOARDING_TYPE`
- `SEED_IMAGE_BASE_URL`

Email:

- `EMAIL_PROVIDER`
- `EMAIL_ENABLED`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SITE_PUBLIC_URL`
- `ADMIN_PUBLIC_URL`
- `CONTACT_TO_EMAIL`

PayPal:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_API_BASE_URL`
- `PAYPAL_ENVIRONMENT`
- `PAYPAL_AUTO_CAPTURE`

## Safe Commands

```sh
pnpm --filter @dtc/backend build
pnpm --filter @dtc/backend start
pnpm --filter @dtc/backend email:test
pnpm --filter @dtc/backend predeploy
pnpm --filter @dtc/backend seed
docker compose build --no-cache medusa
docker compose up -d postgres redis medusa
docker logs medusa_backend --tail=150
```
