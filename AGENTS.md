# AGENTS.md - Repository Operating Guide

Keep project structure modular.

This repository is a production-only Dockerized Medusa v2 stack:

- Backend/admin: Medusa v2 in `apps/backend`.
- Database: Postgres.
- Cache, event bus, locking, and workflow infrastructure: Redis.
- Local uploads: Medusa local file provider serving `/static`.

Read this file, `README.md`, `apps/backend/AGENTS.md`, and `apps/storefront/AGENTS.md` before changing Docker, environment, payment, email, auth, or module behavior.

## Security Rules

- Never commit real `.env` files, secrets, tokens, API keys, Gmail app passwords, PayPal secrets, JWT secrets, cookie secrets, database dumps, private certificates, or production logs containing credentials.
- Keep real values in local `.env` files only. Commit only templates with placeholders.
- Never print secret values in logs, PR comments, issues, docs, or final summaries. Report only whether required secrets exist.
- Do not hardcode public domains, LAN IPs, Docker service names, credentials, CORS origins, or protocols in application code. Read them from app-scoped env files.
- Browser-facing variables must use public browser-reachable HTTPS origins. Docker service names such as `postgres` and `redis` are internal only.
- Do not weaken CORS, auth, cookie, token, SameSite, or Secure settings.
- Do not modify generated output under `node_modules`, `.pnpm`, `.next`, `.medusa`, or similar generated directories.

## Medusa Rules

- Follow official Medusa v2 package scripts: `medusa build`, `medusa start`, `medusa db:migrate`, and `medusa exec` through package scripts.
- Do not patch Medusa internals or `node_modules`.
- Keep `medusa-config.ts` env-driven and fail-fast.
- Required backend production envs include `DATABASE_URL`, `REDIS_URL`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `JWT_SECRET`, `COOKIE_SECRET`, `PUBLIC_BACKEND_URL`, `MEDUSA_BACKEND_URL`, and `MEDUSA_ADMIN_BACKEND_URL`.
- Keep Medusa local file provider `backend_url` derived from `PUBLIC_BACKEND_URL` or the documented public asset origin.
- Preserve secure cookie behavior behind HTTPS reverse proxy: `sameSite: "none"` and `secure: true`.
- Any custom module provider must follow Medusa module/provider conventions and must be registered through `medusa-config.ts` using env-provided options.

## Docker Rules

- Use one production compose file: `docker-compose.yaml`.
- Production Docker must use built images, not host bind mounts.
- Do not mount the host source tree into application containers.
- Backend production image builds the Medusa backend/admin with `pnpm build` from `apps/backend`.
- Backend runtime starts with `pnpm start` from `/server/apps/backend`.
- The image build must fail if Admin `index.html` is missing under `.medusa`.
- Keep PostgreSQL data in the named `postgres_data` volume.
- Keep healthchecks lightweight and dependency-free where possible.

## Core Commands

Production:

```sh
docker compose up -d --build
```

Validation:

```sh
docker compose config
docker compose build --no-cache medusa
docker compose up -d postgres redis medusa
docker compose ps
docker logs medusa_backend --tail=150
npm run check-env
npm run check-no-localhost
npm run check:public-urls
```
