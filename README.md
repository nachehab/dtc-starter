# Ayden Medusa Store

Production-only Medusa v2 backend/admin with PostgreSQL and Redis, managed by a single Docker Compose file.

## Services

- `postgres`: PostgreSQL with persistent named volume `postgres_data`.
- `redis`: Redis for cache, event bus, locking, and workflow infrastructure.
- `medusa`: Medusa backend and pre-built Admin served from the production image.

## Environment

Backend env lives in `apps/backend/.env`. Start from:

```sh
cp apps/backend/.env.production.template apps/backend/.env
```

Required production public values:

```env
PUBLIC_BACKEND_URL=https://your-domain
MEDUSA_BACKEND_URL=https://your-domain
MEDUSA_ADMIN_BACKEND_URL=https://your-domain
ADMIN_CORS=https://your-domain
AUTH_CORS=https://your-domain
```

Also set `DATABASE_URL`, `REDIS_URL`, `CACHE_REDIS_URL`, `LOCKING_REDIS_URL`, `STORE_CORS`, `JWT_SECRET`, and `COOKIE_SECRET`. Browser-facing origins must be public HTTPS origins and must not include the backend container port.

## Docker

Build and run:

```sh
docker compose up -d --build
```

The backend image runs `pnpm build` from `apps/backend`, verifies that an Admin `index.html` exists under `.medusa`, then starts with `pnpm start` from `/server/apps/backend`. There are no source bind mounts and the only published application port is `9000`.

Postgres data is stored in the named volume:

```yaml
volumes:
  postgres_data:
```

Do not delete this volume unless intentionally wiping the database.

## Validation

```sh
docker compose config
docker compose build --no-cache medusa
docker compose up -d postgres redis medusa
docker compose ps
docker logs medusa_backend --tail=150
docker exec -it medusa_backend sh -lc 'pwd && node -p "process.cwd()" && find .medusa -name index.html -print'
docker inspect medusa_backend --format '{{json .Mounts}}'
```

Expected:

- Compose contains no bind mount targeting `/server` or `/app`.
- `medusa_backend` runs from `/server/apps/backend`.
- Admin build output contains an `index.html`.
- `postgres_data` remains declared and mounted at `/var/lib/postgresql/data`.
