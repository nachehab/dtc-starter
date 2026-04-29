# Backend AGENTS.md - Medusa Runtime and Module Compliance

Scope: `apps/backend`, the Medusa v2 backend, Admin runtime, custom modules, providers, routes, subscribers, jobs, migrations, and backend scripts.

Read `../../AGENTS.md`, `../../README.md`, and Medusa v2 documentation before changing backend architecture, module registration, Docker runtime behavior, auth, payment, notification, file, cache, event bus, workflow, or locking behavior.

## Security Baseline

- Never commit real `apps/backend/.env` values or secrets.
- Never log `JWT_SECRET`, `COOKIE_SECRET`, SMTP credentials, PayPal secrets, bearer tokens, session cookies, reset tokens, or webhook signatures.
- Diagnostics may report whether a required env exists, but must not print secret values.
- Keep backend-only secrets out of storefront code, `NEXT_PUBLIC_*`, and browser bundles.
- Do not weaken CORS, auth, secure cookies, or token validation to fix local development friction.
- Do not patch `node_modules`, generated `.medusa` output, or Medusa internals as a permanent fix.

## Required Medusa Conventions

- Use package scripts for Medusa commands:
  - `pnpm --filter @dtc/backend build` -> `medusa build`
  - `pnpm --filter @dtc/backend start` -> `medusa start`
  - `pnpm --filter @dtc/backend dev` -> `medusa develop`
  - `pnpm --filter @dtc/backend predeploy` -> `medusa db:migrate`
  - `pnpm --filter @dtc/backend seed` -> `medusa exec ./src/migration-scripts/initial-data-seed.ts`
- Register modules/providers through `medusa-config.ts` using documented Medusa module provider shapes.
- Keep module options env-driven. No hardcoded public origins, private origins, credentials, or fallback secrets.
- Do not introduce custom Admin output paths, symlinks, `.medusa` copy workarounds, or custom Vite proxy/HMR hacks.

## Backend Env Reference

Backend env belongs in `apps/backend/.env`. Templates may live beside it. Real values must stay local.

Core backend/admin origins:

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
- `COOKIE_SECURE`
- `COOKIE_SAME_SITE`

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

## Module Guidance

### Config

- Keep `medusa-config.ts` close to the official starter shape.
- Local Docker defaults may use `http://192.168.86.176`, `localhost`, and `127.0.0.1` in env files.
- Docker service names may appear only in server-only envs such as `DATABASE_URL` and `REDIS_URL`.
- Do not permit browser-facing values to use Docker service names.
- Cookie settings should stay env-driven:

```ts
sameSite: process.env.COOKIE_SAME_SITE || "lax"
secure: process.env.COOKIE_SECURE === "true"
```

### File Module

- Use Medusa's file module/provider registration pattern.
- For local file provider, keep `upload_dir` server-local and derive `backend_url` from `PUBLIC_BACKEND_URL`.
- Uploaded asset URLs that reach the browser must use the configured browser-reachable backend origin.

### Notification/Email Module

- Use Medusa's notification module provider shape for email/feed providers.
- Keep Gmail SMTP credentials in backend env only.
- Keep `nodemailer` in backend `dependencies` if the provider imports it at runtime.
- Missing optional email config may warn, but must not expose credential values.
- Password reset, contact form, and transactional email links must use `SITE_PUBLIC_URL` or `ADMIN_PUBLIC_URL`.

Safe test:

```sh
pnpm --filter @dtc/backend email:test
```

### Payment/PayPal Module

- Use Medusa's payment provider registration pattern.
- Backend PayPal secrets stay in backend env only.
- Browser PayPal client ID may be exposed only through `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
- Webhook signature validation must use `PAYPAL_WEBHOOK_ID` and the configured PayPal API origin.
- Do not log PayPal secrets, authorization headers, webhook signatures, or raw payment credentials.

### Redis Infrastructure

- Keep caching, event bus, workflow engine, and locking Redis-backed in Docker.
- Use `REDIS_URL` fallbacks only for server-side module providers.
- Do not expose Redis URLs to storefront/browser bundles.

## Safe Commands

From repo root:

```sh
pnpm --filter @dtc/backend build
pnpm --filter @dtc/backend email:test
pnpm --filter @dtc/backend predeploy
pnpm --filter @dtc/backend seed
```

Docker validation:

```sh
docker compose config
docker compose build --no-cache medusa
docker compose up -d postgres redis medusa
docker compose ps
docker logs medusa_backend --tail=150
docker exec -it medusa_backend sh -lc 'pwd && node -p "process.cwd()" && ls -la .medusa/server/public/admin/index.html'
```
