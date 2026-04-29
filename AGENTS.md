# AGENTS.md — Repository Operating Guide

This repository is a Dockerized Medusa v2 commerce stack:

- Backend/admin: Medusa v2 in `apps/backend`.
- Storefront: Next.js in `apps/storefront`.
- Database: Postgres.
- Cache, event bus, locking, and workflow infrastructure: Redis.
- Local uploads: Medusa local file provider serving `/static`.

Read this file, `README.md`, `apps/backend/AGENTS.md`, and `apps/storefront/AGENTS.md` before changing build, Docker, environment, payment, email, auth, or module behavior.

## Non-negotiable security rules

- Never commit real `.env` files, secrets, tokens, API keys, Gmail app passwords, PayPal secrets, JWT secrets, cookie secrets, database dumps, private certificates, or production logs containing credentials.
- Keep real values in local `.env` files only. Commit only templates with placeholders.
- Never print secret values in logs, PR comments, issues, docs, or final summaries. Report only whether required secrets exist.
- Do not hardcode public domains, LAN IPs, Docker service names, localhost, credentials, CORS origins, or protocols in application code. Read them from app-scoped env files.
- Browser-facing variables must use public browser-reachable HTTPS origins. Docker service names such as `medusa`, `postgres`, and `redis` are internal only.
- Do not bypass security checks by weakening CORS, auth, cookie, token, SameSite, or Secure settings. Fix the real origin/proxy/env issue instead.
- Do not disable Medusa Admin, payment, email, or health checks just to make Docker start unless the task explicitly requests a temporary diagnostic mode.
- Do not modify generated dependency/build output under `node_modules`, `.pnpm`, `.next`, `.medusa`, or similar generated directories. Fix source/config instead.

## Medusa compliance rules

- Follow official Medusa v2 package scripts: `medusa build`, `medusa start`, `medusa develop`, `medusa db:migrate`, and `medusa exec` through package scripts.
- Do not patch Medusa internals or `node_modules` as a permanent fix.
- Do not introduce custom Admin output paths, symlinks, or `.medusa` compatibility copies unless Medusa documentation or pinned-version source analysis explicitly requires it and the reason is documented.
- Keep `medusa-config.ts` env-driven and fail-fast. It may validate required envs, but it must not embed real deployment secrets or private origins.
- Required backend production envs include `DATABASE_URL`, `REDIS_URL`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `JWT_SECRET`, `COOKIE_SECRET`, `PUBLIC_BACKEND_URL`, `MEDUSA_BACKEND_URL`, and `MEDUSA_ADMIN_BACKEND_URL`.
- Keep Medusa local file provider `backend_url` derived from `PUBLIC_BACKEND_URL` or the documented public asset origin.
- Preserve secure cookie behavior behind HTTPS reverse proxy: `sameSite: "none"` and `secure: true`.
- Any custom module provider must follow Medusa module/provider conventions and must be registered through `medusa-config.ts` using env-provided options.

## Docker rules

- Production Docker must use built images, not host bind mounts.
- Production compose must not mount `.:/server`, `.:/app`, or expose Vite/HMR ports.
- Development compose may use bind mounts and live reload, but only in `docker-compose.dev.yaml`.
- Backend production image builds the Medusa backend/admin with `pnpm --filter @dtc/backend build` and starts with `pnpm start` from the isolated Medusa app root.
- Storefront production image builds only the storefront and starts with `pnpm start` from the storefront app root.
- Keep backend and storefront Docker responsibilities separate. Do not build the storefront inside the backend Dockerfile unless there is a documented reason.
- Use BuildKit secrets for build-time env files. Do not intentionally copy `.env` files into runtime images.
- Keep healthchecks lightweight and dependency-free where possible. Prefer Node-based HTTP probes over adding curl/wget solely for healthchecks.
- Use Compose `depends_on.condition: service_healthy` only with real healthchecks.

## Dev/production separation

- Production compose is `docker-compose.yaml`.
- Dev compose is `docker-compose.dev.yaml`, layered on top of production compose.
- Dev and production may use different `.env` values, but for a given deployed reverse-proxy environment they must keep public URLs, CORS origins, auth URLs, cookie secrets, JWT secrets, and proxy assumptions internally consistent.
- The dev override should only change live reload behavior, bind mounts, polling, container names, exposed dev/HMR ports, and dev commands.
- Do not duplicate or override auth, CORS, public URL, cookie secret, JWT secret, database, or Redis values in `docker-compose.dev.yaml`.

## Validation before finalizing changes

Run or document expected results for:

```sh
docker compose config
docker compose build --no-cache medusa
docker compose up -d postgres redis medusa
docker compose ps
docker logs medusa_backend --tail=150
```

For Docker production, verify:

```sh
docker exec -it medusa_backend sh -lc 'pwd && node -p "process.cwd()" && ls -la .medusa/server/public/admin/index.html'
docker inspect medusa_backend --format '{{json .Mounts}}'
```

The Medusa backend should not have a production bind mount to `/server` or `/app`.

## Core commands

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
npm run healthcheck
```

## Module ownership map

- Backend / Medusa modules: `apps/backend/AGENTS.md`
- Storefront / Next.js: `apps/storefront/AGENTS.md`
- Docker / reverse proxy / deployment: `docs/AGENTS.infrastructure.md`
- Security compliance: `docs/AGENTS.security.md`

## Change style

- Make small, reversible commits.
- Prefer validation scripts and clear errors over silent fallback behavior.
- Keep documentation updated when changing Docker, env, reverse-proxy, payment, email, healthcheck, or Medusa module behavior.
- When unsure, inspect the actual Medusa package/source behavior used by the pinned version before inventing a workaround.
