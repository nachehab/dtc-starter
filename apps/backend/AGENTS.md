# Backend Agent Guide

Scope: `apps/backend`, the Medusa v2 backend and admin runtime.

Read `README.md`, `../../README.md`, and `../../AGENTS.md` before changing backend, Docker, env, auth, payment, email, or upload behavior.

## Backend Env Reference

Backend env belongs in `apps/backend/.env`. Use `apps/backend/.env.example`, `.env.template`, `.env.development.template`, or `.env.production.template` as references, then fill real values locally. Do not commit real secrets.

Public backend/admin origins:

- `PUBLIC_BACKEND_URL`
- `MEDUSA_BACKEND_URL`
- `MEDUSA_ADMIN_BACKEND_URL`
- `PUBLIC_ASSET_BASE_URL`

Server-to-server/internal URL:

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

Admin Vite/HMR:

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

PayPal:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_API_BASE_URL`
- `PAYPAL_ENVIRONMENT`
- `PAYPAL_AUTO_CAPTURE`

Email:

- `EMAIL_PROVIDER`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SITE_PUBLIC_URL`
- `ADMIN_PUBLIC_URL`
- `CONTACT_TO_EMAIL`
- `EMAIL_ENABLED`

Other:

- `DB_NAME`
- `MEDUSA_ADMIN_ONBOARDING_TYPE`
- `DISABLE_MEDUSA_ADMIN`
- `MEDUSA_WORKER_MODE`
- `PORT`
- `SEED_IMAGE_BASE_URL`

## Medusa Config Rules

- Keep `medusa-config.ts` as the source of backend runtime validation.
- `PUBLIC_BACKEND_URL`, `MEDUSA_BACKEND_URL`, and `MEDUSA_ADMIN_BACKEND_URL` must resolve to the same public HTTPS backend/admin origin for deployed Docker use.
- The local file provider must derive `backend_url` from `PUBLIC_BACKEND_URL` and append `/static`.
- Do not hardcode local origins, Docker service names, LAN IPs, loopback hosts, or fallback browser origins.
- Docker service names such as `postgres`, `redis`, and `medusa` are server/container-only.
- Preserve Redis-backed caching, event bus, workflow engine, and locking unless the architecture intentionally changes.
- Preserve the Vite HMR public host, `wss`, and client port `443` behavior behind the reverse proxy.

## Email Setup Rules

- Gmail SMTP is enabled only when backend env is configured for it.
- Confirm `EMAIL_PROVIDER=gmail` before debugging Gmail behavior.
- Confirm `EMAIL_ENABLED=true` when expecting real SMTP delivery.
- Confirm `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` are present.
- Confirm `SITE_PUBLIC_URL` and `ADMIN_PUBLIC_URL` are public HTTPS origins.
- Confirm `nodemailer` is in `dependencies` and `@types/nodemailer` is in `devDependencies`.
- Never print `SMTP_PASS` or full SMTP auth objects.
- Prefer sanitized diagnostics: print whether a setting is present, not its secret value.

Safe command:

```sh
pnpm --filter @dtc/backend email:test
```

## PayPal Backend Rules

- Keep backend PayPal secrets only in `apps/backend/.env`.
- Required backend envs are `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_API_BASE_URL`, `PAYPAL_ENVIRONMENT`, and `PAYPAL_AUTO_CAPTURE`.
- Webhook URL must be based on the public backend origin:

```text
{PUBLIC_BACKEND_URL}/hooks/payment/paypal_paypal
```

- Do not expose `PAYPAL_CLIENT_SECRET` or webhook credentials to the storefront.
- Use explicit TypeScript types in PayPal modules and services.
- Keep provider activation conditional on required backend credentials so local builds can run without real payment credentials.

## Cookie and Session Rules

- Preserve secure cross-site admin cookie behavior:

```ts
sameSite: "none"
secure: true
```

- Never rotate `COOKIE_SECRET` or `JWT_SECRET` casually. Changing either can invalidate sessions and tokens.
- Admin login depends on HTTPS public origins, exact CORS/auth origins, stable secrets, and correct reverse proxy headers.
- For login loops, verify the browser stores `connect.sid` for `ridersadmin.nchehab.ddns.net` with `Secure=true` and `SameSite=None`.
- Add only sanitized debug logging. Never log secrets, full cookies, bearer tokens, or session contents.

## Migration and Script Rules

- Keep migration scripts under `src/migration-scripts` and operational scripts under `src/scripts`.
- Use Medusa commands through the package scripts when possible.
- Run migrations with the backend env loaded for the intended Docker mode.
- Make seed and fix scripts idempotent where practical.
- Do not write scripts that rewrite public URLs to local or Docker-only origins.
- If image URLs are wrong in the DB, use the root `fix-image-urls` workflow and public asset base URL.

## Safe Commands

From the repo root:

```sh
pnpm --filter @dtc/backend build
pnpm --filter @dtc/backend email:test
pnpm --filter @dtc/backend predeploy
pnpm --filter @dtc/backend seed
docker compose exec medusa printenv | sort
```

Before committing env or URL-related work:

```sh
npm run check-env
npm run check-no-localhost
npm run check:public-urls
```

## Common Failure: Cannot Find Module `nodemailer`

Checklist:

- Confirm `apps/backend/package.json` has `nodemailer` in `dependencies`.
- Confirm `@types/nodemailer` is available for TypeScript.
- Confirm the lockfile was updated after dependency changes.
- Rebuild the backend image after dependency or lockfile changes:

```sh
docker compose build --no-cache medusa
docker compose up -d medusa
```

## Common Failure: Admin Login Loop

Likely causes:

- Missing or changed `COOKIE_SECRET` or `JWT_SECRET`.
- Cookie not set with `Secure=true` and `SameSite=None`.
- Backend env uses a non-public origin for `PUBLIC_BACKEND_URL`, `MEDUSA_BACKEND_URL`, `MEDUSA_ADMIN_BACKEND_URL`, `STORE_CORS`, `ADMIN_CORS`, or `AUTH_CORS`.
- Reverse proxy does not forward `Host`, `X-Forwarded-Proto=https`, `X-Forwarded-Host`, and `X-Forwarded-Port=443`.
- Browser-facing admin traffic is routed to a random Vite/HMR port instead of backend/admin.

First checks:

```sh
docker compose exec medusa printenv | grep -E "PUBLIC_BACKEND_URL|MEDUSA_BACKEND_URL|MEDUSA_ADMIN_BACKEND_URL|STORE_CORS|ADMIN_CORS|AUTH_CORS|COOKIE_SECRET|JWT_SECRET"
docker logs medusa_backend
```
