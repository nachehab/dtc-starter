# Infrastructure and Docker Agent Guide

Scope: root Docker files, reverse proxy assumptions, environment separation, and validation workflows.

There is no `infra` or `docker` directory in this repo, so this file is the scoped infrastructure guide. Read `../README.md` and `../AGENTS.md` before changing compose, Dockerfile, or proxy-sensitive behavior.

## Compose Files

- `docker-compose.yaml` is production/stable.
- `docker-compose.dev.yaml` is a development override for live reload.
- Production command:

```sh
docker compose up -d --build
```

- Dev/live reload command:

```sh
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --profile dev up
```

## Production Compose Rules

- Keep production compose production-oriented.
- Production builds the backend from the root `Dockerfile`.
- Production builds the storefront from `apps/storefront/Dockerfile`.
- Production uses app-scoped env files:
  - `apps/backend/.env`
  - `apps/storefront/.env`
- Production publishes only:
  - `9000` for Medusa backend/admin
  - `8000` for Next.js storefront
- Do not publish random admin Vite ports in production.
- Do not put secrets directly in compose files.

## Dev Override Rules

`docker-compose.dev.yaml` may change only:

- Live reload commands.
- Bind mounts.
- Polling variables such as `CHOKIDAR_USEPOLLING` and `WATCHPACK_POLLING`.
- Dev container names.
- Dev build targets.
- Dev-only HMR exposure, currently `5173`.

It must not override or duplicate:

- `PUBLIC_BACKEND_URL`
- `MEDUSA_BACKEND_URL`
- `MEDUSA_ADMIN_BACKEND_URL`
- `STORE_CORS`
- `ADMIN_CORS`
- `AUTH_CORS`
- `COOKIE_SECRET`
- `JWT_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- PayPal credentials
- SMTP credentials

Dev and production should share the same public URL, cookie, auth, CORS, and reverse proxy assumptions for the same deployed environment.

## BuildKit Secrets

Validate Docker BuildKit secrets stay wired as:

- `backend_env` -> `./apps/backend/.env`
- `storefront_env` -> `./apps/storefront/.env`

Use BuildKit secrets for build-time env loading. Do not copy real `.env` files into images or commit them.

Validation:

```sh
docker compose config
docker compose build --no-cache
```

## Docker Networking

- Backend to Postgres uses `postgres`.
- Backend to Redis uses `redis`.
- Reverse proxy to backend uses `medusa:9000`.
- Reverse proxy to storefront uses `storefront:8000`.
- Browser-facing env values use public HTTPS origins, not Docker service names.
- `localhost`, `127.0.0.1`, LAN IPs, Docker service names, and random HMR ports must not appear in client-facing bundles.

## Reverse Proxy / OPNsense Rules

Validate HTTPS routing:

```text
ridersadmin.nchehab.ddns.net -> medusa:9000
ridersparadise.nchehab.ddns.net -> storefront:8000
```

Required headers:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port 443;
```

Dev HMR:

- Websocket upgrades are needed only when using the dev profile.
- Admin HMR should use the public host, `wss`, and client port `443`.
- Public admin traffic should route to backend/admin, not a random Vite port.

## Production Validation

```sh
docker compose down
docker compose build --no-cache
docker compose up -d
docker logs medusa_backend
docker logs medusa_storefront
```

Then run:

```sh
npm run check-env
npm run check-no-localhost
npm run check:public-urls
```

## Dev Validation

```sh
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --profile dev up
```

Then confirm:

- Backend/admin responds through the public backend/admin HTTPS origin.
- Storefront responds through the public storefront HTTPS origin.
- Admin HMR uses `wss` through the reverse proxy when dev profile is active.
- No auth, CORS, secret, database, or Redis env values were duplicated in the dev override.

## Container Env Checks

```sh
docker compose exec medusa printenv | sort
docker compose exec storefront printenv | sort
```

When sharing output, redact secrets and credentials. For `COOKIE_SECRET`, `JWT_SECRET`, `SMTP_PASS`, `PAYPAL_CLIENT_SECRET`, and database credentials, report presence only.

## URL Leak Checks

```sh
npm run check-no-localhost
npm run check:public-urls
```

Run these after frontend/admin builds and before committing URL or env changes.
