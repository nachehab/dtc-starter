# AGENTS.md - Repository Operating Guide

This repository is a Dockerized Medusa v2 commerce stack:

- Backend/admin: Medusa v2 in `apps/backend`.
- Storefront: Next.js in `apps/storefront`.
- Database: Postgres.
- Cache, event bus, locking, and workflow infrastructure: Redis.
- Local uploads: Medusa local file provider serving `/static`.

Read this file, `README.md`, `apps/backend/AGENTS.md`, and `apps/storefront/AGENTS.md` before changing build, Docker, environment, payment, email, auth, or module behavior.

## Security Rules

- Never commit real `.env` files, secrets, tokens, API keys, Gmail app passwords, PayPal secrets, JWT secrets, cookie secrets, database dumps, private certificates, or production logs containing credentials.
- Keep real values in local `.env` files only. Commit only templates with placeholders or local-development defaults.
- Never print secret values in logs, PR comments, issues, docs, or final summaries. Report only whether required secrets exist.
- Do not hardcode public domains, LAN IPs, Docker service names, localhost, credentials, CORS origins, or protocols in application source code. Read them from app-scoped env files.
- Browser-facing variables may use the local LAN HTTP defaults for local development. Reintroduce public HTTPS domains only through env files after the local stack is stable.
- Do not bypass security checks by weakening CORS, auth, cookie, token, SameSite, or Secure settings. Fix the real origin/proxy/env issue instead.
- Do not modify generated dependency/build output under `node_modules`, `.pnpm`, `.next`, `.medusa`, or similar generated directories. Fix source/config instead.

## Medusa Rules

- Follow official Medusa v2 package scripts: `medusa build`, `medusa start`, `medusa develop`, `medusa db:migrate`, and `medusa exec` through package scripts.
- Do not patch Medusa internals or `node_modules` as a permanent fix.
- Do not introduce custom Admin output paths, symlinks, or `.medusa` compatibility copies.
- Keep `medusa-config.ts` env-driven and close to the official starter structure.
- Keep Medusa local file provider `backend_url` derived from `PUBLIC_BACKEND_URL`.
- Keep cookie behavior env-driven with `COOKIE_SAME_SITE` and `COOKIE_SECURE`.
- Custom module providers must follow Medusa module/provider conventions and be registered through `medusa-config.ts` using env-provided options.

## Docker Rules

- Production Docker uses built images, not host bind mounts.
- Production compose must not mount `.:/server`, `.:/app`, or expose Vite/HMR ports.
- Development compose may use bind mounts and live reload, but only in `docker-compose.dev.yaml`.
- Backend production image builds the Medusa backend/admin with `pnpm --filter @dtc/backend build` and starts with `pnpm start` from the isolated Medusa app root.
- Storefront production image builds only the storefront and starts with `pnpm start` from the storefront app root.
- Keep backend and storefront Docker responsibilities separate.
- Use BuildKit secrets for build-time env files. Do not intentionally copy `.env` files into runtime images.
- Keep healthchecks lightweight and dependency-free where possible. Prefer Node-based HTTP probes over adding curl/wget solely for healthchecks.
- Use Compose `depends_on.condition: service_healthy` only with real healthchecks.

## Dev And Production

- Production compose is `docker-compose.yaml`.
- Dev compose is `docker-compose.dev.yaml`, layered on top of production compose.
- Dev and production may use the same local LAN defaults while stabilizing the local stack.
- The dev override should only change live reload behavior, bind mounts, polling, container names, exposed dev/HMR ports, and dev commands.

## Validation

Run or document expected results for:

```sh
pnpm install --frozen-lockfile
pnpm --filter @dtc/backend build
pnpm --filter @dtc/storefront build
docker compose config
docker compose build --no-cache
docker compose up
```

For Docker production, verify:

```sh
docker exec -it medusa_backend sh -lc 'pwd && node -p "process.cwd()" && ls -la .medusa/server/public/admin/index.html'
docker inspect medusa_backend --format '{{json .Mounts}}'
```

The Medusa backend should not have a production bind mount to `/server` or `/app`.

## Core Commands

Production:

```sh
docker compose up -d --build
```

Dev with live reload:

```sh
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --profile dev up
```

## Module Ownership Map

- Backend / Medusa modules: `apps/backend/AGENTS.md`
- Storefront / Next.js: `apps/storefront/AGENTS.md`

## Change Style

- Make small, reversible commits.
- Prefer validation scripts and clear errors over silent fallback behavior.
- Keep documentation updated when changing Docker, env, reverse-proxy, payment, email, healthcheck, or Medusa module behavior.
- When unsure, inspect the actual Medusa package/source behavior used by the pinned version before inventing a workaround.
