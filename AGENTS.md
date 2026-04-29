# Agent Guide

## Project Purpose

This repository is a Dockerized commerce stack:

- Backend/admin: Medusa v2 in `apps/backend`.
- Storefront: Next.js in `apps/storefront`.
- Database: Postgres.
- Cache and workflow infrastructure: Redis.
- Local uploads: Medusa local file provider serving `/static`.

Read `README.md`, `apps/backend/README.md`, and `apps/storefront/README.md` before changing build, Docker, or environment behavior.

## Core Commands

Production:

```sh
docker compose up -d --build
```

Dev with live reload:

```sh
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --profile dev up
```

Validation:

```sh
npm run check-env
npm run check-no-localhost
npm run check:public-urls
```

## Critical Project Rules

- Keep project structure modular.
- Never hardcode URLs in source files.
- Never hardcode domains, IPs, ports, protocols, env values, or fallback origins in frontend/admin bundles.
- Always read URLs, origins, database connections, Redis connections, CORS values, and secrets from env variables.
- Keep env files app-scoped. Backend-only variables go in `apps/backend/.env`; storefront browser variables go in `apps/storefront/.env`.
- Do not copy `.env.example` wholesale into both apps. It documents the union of supported variables.
- Do not duplicate keys inside any env file.
- Do not commit real secrets.
- The Medusa file provider `backend_url` must always be set from `PUBLIC_BACKEND_URL`.
- `NEXT_PUBLIC_*` and `VITE_PUBLIC_*` variables are browser-exposed. Never put secrets in them.
- Browser-facing env vars must use public HTTPS domains.
- Internal Docker service names are only for container-to-container communication.
- LAN IPs, loopback hostnames, Docker service URLs, and random Vite HMR ports must never appear in client-facing bundles.
- Medusa admin Vite HMR must use the configured public host, `wss`, and port `443` behind the reverse proxy.
- Public image and `/static` URLs must be normalized through the public asset base URL before reaching browsers.

## Dev/Production Separation

- Production compose is `docker-compose.yaml`.
- Dev compose is `docker-compose.dev.yaml`, layered on top of production compose.
- Dev and production must share the same public URLs, CORS origins, auth URLs, cookie secrets, JWT secrets, and reverse proxy assumptions for a given deployed environment.
- The dev override must only change live reload behavior, bind mounts, polling, container names, exposed dev/HMR ports, and dev commands.
- Do not duplicate or override auth, CORS, public URL, cookie secret, JWT secret, database, or Redis values in `docker-compose.dev.yaml`.
- Rebuild after Dockerfile, package, lockfile, or build-time public env changes.
- Restart enough containers after runtime-only env changes.

## Environment Validation Agent

Responsibilities:

- Validate `apps/backend/.env` and `apps/storefront/.env`.
- Confirm public backend/admin URLs are HTTPS public domains.
- Confirm `STORE_CORS`, `ADMIN_CORS`, and `AUTH_CORS` are exact public origins.
- Confirm `COOKIE_SECRET` and `JWT_SECRET` exist and stay stable.
- Confirm `DATABASE_URL` uses the `postgres` host inside Docker.
- Confirm `REDIS_URL` uses the `redis` host inside Docker.
- Confirm `NEXT_PUBLIC_MEDUSA_BACKEND_URL` is a public HTTPS backend/admin origin.
- Confirm `NEXT_PUBLIC_BASE_URL` is a public HTTPS storefront origin.
- Confirm no `NEXT_PUBLIC_*` or `VITE_PUBLIC_*` value contains a secret, Docker service name, loopback host, LAN IP, or random HMR port.
- Confirm env files do not contain duplicate keys.

Run:

```sh
docker compose config
docker compose exec medusa printenv | grep -E "PUBLIC_BACKEND_URL|MEDUSA_BACKEND_URL|MEDUSA_ADMIN_BACKEND_URL|STORE_CORS|ADMIN_CORS|AUTH_CORS|COOKIE_SECRET|JWT_SECRET|DATABASE_URL|REDIS_URL"
npm run check-env
npm run check-no-localhost
```

Never print secret values in logs, comments, issues, or final summaries. Report whether they exist and whether they are stable.

## Docker Agent

Responsibilities:

- Keep `docker-compose.yaml` stable and production-oriented.
- Keep `docker-compose.dev.yaml` as override-only for live reload.
- Do not duplicate auth, CORS, public URL, or secret values in the dev override.
- Validate BuildKit secrets:
  - `apps/backend/.env` mounted as `backend_env`.
  - `apps/storefront/.env` mounted as `storefront_env`.
- Production publishes only `9000` and `8000` unless an explicit project requirement says otherwise.
- Dev may expose `5173` for Vite/HMR only.
- Keep Postgres and Redis service names stable for container networking.
- Keep browser-facing public origins out of Docker service names.

Operational rules:

- Rebuild after Dockerfile, package, lockfile, or build-time public env changes.
- Restart enough containers after runtime-only env changes.
- Use `docker compose config` after compose edits.
- Use `docker compose build --no-cache` when validating Dockerfile or BuildKit secret behavior.

## Backend/Medusa Agent

Responsibilities:

- Work in `apps/backend`.
- Validate Medusa config, modules, plugins, payment providers, notification providers, scripts, and migrations.
- Ensure `nodemailer` is declared if the email service imports it.
- Ensure PayPal dependencies and envs are declared.
- Preserve secure cookie config:

```ts
sameSite: "none"
secure: true
```

- Preserve proxy trust compatibility for HTTPS reverse proxy behavior.
- Never change `COOKIE_SECRET` or `JWT_SECRET` casually.
- Keep Medusa local file provider `backend_url` derived from `PUBLIC_BACKEND_URL`.
- Keep Docker database and Redis URLs server-only.

Run:

```sh
pnpm --filter @dtc/backend build
pnpm --filter @dtc/backend email:test
```

## Storefront Agent

Responsibilities:

- Work in `apps/storefront`.
- Validate Next.js build, lint, PayPal client code, product pages, checkout, asset URL handling, and env usage.
- Fix ESLint errors properly instead of disabling lint globally.
- Avoid `any`; use explicit types or `unknown` with narrowing.
- Do not move storefront runtime to the monorepo root.
- Keep browser-safe variables under `NEXT_PUBLIC_*`.
- Keep backend secrets out of storefront code and env.
- Ensure asset URLs and `/static` URLs are normalized through the public asset/backend origin before reaching the browser.

Run:

```sh
pnpm --filter @dtc/storefront lint
pnpm --filter @dtc/storefront build
```

## Admin Auth/Cookie Agent

Responsibilities:

- Troubleshoot login loops involving `/app/login`, `/cloud/auth`, `/app/?token`, and `/app`.
- Confirm browser stores `connect.sid` for `ridersadmin.nchehab.ddns.net`.
- Confirm cookie attributes:
  - `Secure=true`
  - `SameSite=None`
- Confirm proxy forwards:
  - `Host`
  - `X-Forwarded-Proto=https`
  - `X-Forwarded-Host`
  - `X-Forwarded-Port=443`
- Confirm backend env uses public HTTPS origins for:
  - `PUBLIC_BACKEND_URL`
  - `MEDUSA_BACKEND_URL`
  - `MEDUSA_ADMIN_BACKEND_URL`
  - `STORE_CORS`
  - `ADMIN_CORS`
  - `AUTH_CORS`
- Add sanitized debug logging only.
- Never log secrets, full cookies, auth tokens, SMTP credentials, or payment credentials.

Cookie check:

```text
Browser DevTools -> Application -> Cookies -> ridersadmin.nchehab.ddns.net -> connect.sid must exist with Secure=true and SameSite=None.
```

## Email Agent

Responsibilities:

- Validate Gmail SMTP setup.
- Confirm `EMAIL_PROVIDER=gmail`.
- Confirm `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`.
- Confirm `SITE_PUBLIC_URL` and `ADMIN_PUBLIC_URL` are public HTTPS origins.
- Confirm `nodemailer` and `@types/nodemailer` are installed in the backend package.
- Never print `SMTP_PASS`.
- Keep email provider configuration in `apps/backend/.env`.

Run:

```sh
pnpm --filter @dtc/backend email:test
```

## PayPal Agent

Responsibilities:

- Validate backend PayPal envs:
  - `PAYPAL_CLIENT_ID`
  - `PAYPAL_CLIENT_SECRET`
  - `PAYPAL_WEBHOOK_ID`
  - `PAYPAL_API_BASE_URL`
  - `PAYPAL_ENVIRONMENT`
  - `PAYPAL_AUTO_CAPTURE`
- Validate storefront PayPal env:
  - `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- Ensure webhook URL is:

```text
{PUBLIC_BACKEND_URL}/hooks/payment/paypal_paypal
```

- Do not expose backend PayPal secrets to frontend code, logs, build output, or `NEXT_PUBLIC_*` env vars.
- Use explicit TypeScript types in PayPal service files.

## Reverse Proxy / OPNsense Agent

Responsibilities:

- Validate HTTPS routing for:
  - `ridersadmin.nchehab.ddns.net -> medusa:9000`
  - `ridersparadise.nchehab.ddns.net -> storefront:8000`
- Validate websocket upgrades for dev HMR only when using the dev profile.
- Ensure admin public traffic routes to backend/admin, not Vite random ports.
- Confirm public browser requests use HTTPS origins and proxy to Docker services internally.

Required headers:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port 443;
```

## Build/Lint Agent

Responsibilities:

- Treat production build errors as blockers.
- Fix TypeScript and ESLint errors without suppressing unless the suppression is narrow and justified.
- Warnings may remain unless related to broken behavior, env leaks, auth, cookies, checkout, payments, images, or reverse proxy behavior.
- Keep dependency and lockfile changes intentional.
- Confirm Docker builds after package, lockfile, Dockerfile, or public build-time env changes.

Run:

```sh
pnpm install --frozen-lockfile
pnpm --filter @dtc/backend build
pnpm --filter @dtc/storefront build
docker compose build --no-cache
```

## Debug Checklist

1. Check env values in `apps/backend/.env` and `apps/storefront/.env`.
2. Check existing DB image URLs and run `npm run fix-image-urls` if old local origins are present.
3. Check container networking: backend to Postgres uses `postgres`; backend to Redis uses `redis`; browser-facing values use public HTTPS origins.
4. Clear the frontend build cache if public env values changed.
5. Run `npm run check-env` and `npm run check-no-localhost` before committing env or URL-related changes.
6. Run `npm run check:public-urls` after frontend/admin builds to catch forbidden public URL leaks.

## More Scoped Guides

- Backend: `apps/backend/AGENTS.md`
- Storefront: `apps/storefront/AGENTS.md`
- Infrastructure and Docker: `docs/AGENTS.infrastructure.md`
- Troubleshooting: `docs/AGENTS.troubleshooting.md`
