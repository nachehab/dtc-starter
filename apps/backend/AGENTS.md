# Backend AGENTS.md — Medusa Runtime and Module Compliance

Scope: `apps/backend`, the Medusa v2 backend, Admin runtime, custom modules, providers, routes, subscribers, jobs, migrations, and backend scripts.

Read `../../AGENTS.md`, `../../README.md`, and Medusa v2 documentation before changing backend architecture, module registration, Docker runtime behavior, auth, payment, notification, file, cache, event bus, workflow, or locking behavior.

## Security baseline

- Never commit real `apps/backend/.env` values or secrets.
- Never log `JWT_SECRET`, `COOKIE_SECRET`, SMTP credentials, PayPal secrets, bearer tokens, session cookies, reset tokens, or webhook signatures.
- Diagnostics may report whether a required env exists, but must not print secret values.
- Keep backend-only secrets out of storefront code, `NEXT_PUBLIC_*`, `VITE_PUBLIC_*`, and browser bundles.
- Do not weaken CORS, auth, secure cookies, or token validation to fix local development friction.
- Do not patch `node_modules`, generated `.medusa` output, or Medusa internals as a permanent fix.

## Required Medusa conventions

- Use package scripts for Medusa commands:
  - `pnpm --filter @dtc/backend build` -> `medusa build`
  - `pnpm --filter @dtc/backend start` -> `medusa start`
  - `pnpm --filter @dtc/backend dev` -> `medusa develop`
  - `pnpm --filter @dtc/backend predeploy` -> `medusa db:migrate`
  - `pnpm --filter @dtc/backend seed` -> `medusa exec ./src/migration-scripts/initial-data-seed.ts`
- Register modules/providers through `medusa-config.ts` using documented Medusa module provider shapes.
- Keep module options env-driven. No hardcoded public origins, private origins, credentials, or fallback secrets.
- Do not introduce custom Admin output paths, symlinks, or `.medusa` copy workarounds unless documented by Medusa for the pinned version and explained in code comments.
- Do not disable Admin in production unless deployment intentionally separates Admin from server runtime and the README explains the topology.

## Backend env reference

Backend env belongs in `apps/backend/.env`. Templates may live beside it. Real values must stay local.

Public backend/admin origins:

- `PUBLIC_BACKEND_URL`
- `MEDUSA_BACKEND_URL`
- `MEDUSA_ADMIN_BACKEND_URL`
- `PUBLIC_ASSET_BASE_URL`

Server/internal URL:

- `INTERNAL_MEDUSA_URL`

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

Admin Vite/HMR, dev only unless documented otherwise:

- `VITE_HOST`
- `VITE_ORIGIN`
- `VITE_ALLOWED_HOSTS`
- `VITE_PUBLIC_HOST`
- `VITE_PUBLIC_ADMIN_BASE_URL`
- `VITE_PUBLIC_BACKEND_URL`
- `VITE_PUBLIC_ASSET_BASE_URL`
- `VITE_HMR_PROTOCOL`
- `VITE_HMR_HOST`
- `VITE_HMR_CLIENT_PORT`
- `VITE_DEV_PORT`

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

## Module agents

### Config validation agent

Responsibilities:

- Keep `medusa-config.ts` as the backend runtime validation gate.
- Validate required envs early and fail clearly.
- `PUBLIC_BACKEND_URL`, `MEDUSA_BACKEND_URL`, and `MEDUSA_ADMIN_BACKEND_URL` should be public HTTPS origins for deployed Docker use.
- Docker service names may appear only in server-only envs such as `DATABASE_URL`, `REDIS_URL`, and internal URLs.
- Do not permit browser-facing values to use localhost, loopback, LAN IPs, Docker service names, or random Vite ports.

### File module agent

Responsibilities:

- Use Medusa's file module/provider registration pattern.
- For local file provider, keep `upload_dir` server-local and derive `backend_url` from the configured public backend/asset origin.
- Uploaded asset URLs that reach the browser must use public HTTPS origins.
- Do not save Docker service names, LAN IPs, or localhost URLs into product image records.

### Notification/email module agent

Responsibilities:

- Use Medusa's notification module provider shape for email/feed providers.
- Keep Gmail SMTP credentials in backend env only.
- Keep `nodemailer` in backend `dependencies` if the provider imports it at runtime.
- Missing optional email config may warn, but must not expose credential values.
- Password reset, contact form, and transactional email links must use `SITE_PUBLIC_URL` or `ADMIN_PUBLIC_URL` public HTTPS origins.

Safe test:

```sh
pnpm --filter @dtc/backend email:test
```

### Payment/PayPal module agent

Responsibilities:

- Use Medusa's payment provider registration pattern.
- Backend PayPal secrets stay in backend env only.
- Browser PayPal client ID may be exposed only through documented storefront public env.
- Webhook signature validation must use `PAYPAL_WEBHOOK_ID` and the configured PayPal API origin.
- Webhook URL format:

```text
{PUBLIC_BACKEND_URL}/hooks/payment/paypal_paypal
```

- Do not log PayPal secrets, authorization headers, webhook signatures, or raw payment credentials.

### Redis infrastructure module agent

Responsibilities:

- Keep caching, event bus, workflow engine, and locking Redis-backed in production unless architecture intentionally changes.
- Use `REDIS_URL` fallbacks only for server-side module providers.
- Do not expose Redis URLs to storefront/browser bundles.
- If Redis is unavailable, fail readiness rather than silently degrading production consistency.

### Admin/auth/cookie agent

Responsibilities:

- Preserve secure cookie settings:

```ts
sameSite: "none"
secure: true
```

- Do not rotate `COOKIE_SECRET` or `JWT_SECRET` casually.
- Login loops usually mean cookie/origin/proxy mismatch, not a reason to weaken auth.
- Required reverse proxy headers:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port 443;
```

- Sanitized debug logs only. Never log full cookies, reset tokens, JWTs, sessions, or auth headers.

### Health/readiness agent

Responsibilities:

- `/health` should indicate the process is alive.
- `/ready` should indicate required dependencies such as Postgres and Redis are reachable when implemented.
- Docker healthchecks must be lightweight and not require extra shell tools when Node can do the job.
- Compose readiness should wait on real healthchecks, not merely container start.

## Safe commands

From repo root:

```sh
pnpm --filter @dtc/backend build
pnpm --filter @dtc/backend email:test
pnpm --filter @dtc/backend predeploy
pnpm --filter @dtc/backend seed
npm run check-env
npm run check-no-localhost
npm run check:public-urls
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

## Common failures

### Admin bundle exists but Medusa cannot find it

Check runtime root alignment before adding workarounds:

```sh
docker exec -it medusa_backend sh -lc 'pwd && node -p "process.cwd()" && find .medusa -name index.html -print'
```

The production backend image should run from the isolated Medusa app root where `.medusa/server/public/admin/index.html` exists.

### Cannot find module `nodemailer`

- Confirm `nodemailer` is in backend `dependencies`.
- Confirm lockfile was updated.
- Rebuild backend image after dependency changes.

### Admin login loop

Check:

- Stable `COOKIE_SECRET` and `JWT_SECRET`.
- Exact public HTTPS `STORE_CORS`, `ADMIN_CORS`, and `AUTH_CORS`.
- Public HTTPS backend/admin URLs.
- Reverse proxy forwarded HTTPS headers.
- Browser has `connect.sid` with `Secure=true` and `SameSite=None`.
