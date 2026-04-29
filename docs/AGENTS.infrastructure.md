# Infrastructure AGENTS.md — Docker, Compose, Reverse Proxy, and Operations

Scope: root Docker files, Docker Compose, local/prod runtime topology, reverse proxy assumptions, healthchecks, readiness, public URL routing, and operational validation.

Read `../AGENTS.md`, `../README.md`, `../apps/backend/AGENTS.md`, and `../apps/storefront/AGENTS.md` before changing infrastructure behavior.

## Security baseline

- Do not commit real `.env` files, proxy certificates, private keys, API secrets, app passwords, database dumps, or production logs with credentials.
- Do not print secrets in Docker logs, validation output, docs, comments, or issue bodies.
- Compose should reference app-scoped env files; do not inline production secrets directly into `docker-compose.yaml`.
- Browser-facing values must be public HTTPS origins. Docker service names are internal only.

## Production Compose rules

Production compose is `docker-compose.yaml`.

Required behavior:

- Uses built images.
- Does not bind-mount source into app containers.
- Does not expose Vite/HMR ports.
- Publishes only required service ports, currently backend `9000` and storefront `8000`.
- Loads backend env from `apps/backend/.env`.
- Loads storefront env from `apps/storefront/.env`.
- Uses BuildKit secrets for build-time app env files.
- Uses `depends_on.condition: service_healthy` only where the dependency has a real healthcheck.
- Keeps Postgres and Redis state in named volumes.

Forbidden in production compose:

```yaml
volumes:
  - .:/server
  - .:/app
ports:
  - "5173:5173"
```

## Development Compose rules

Development compose is `docker-compose.dev.yaml` and must remain an override.

Allowed only in dev:

- Source bind mounts.
- Live reload commands such as `pnpm dev`.
- Polling flags such as `CHOKIDAR_USEPOLLING` and `WATCHPACK_POLLING`.
- Vite/HMR port exposure.
- Dev-specific container names.

Dev override must not redefine real auth, CORS, secrets, database, Redis, or public URL values.

## Dockerfile rules

Backend image:

- Install dependencies with pnpm/Corepack.
- Build backend/admin with `pnpm --filter @dtc/backend build`.
- Validate `.medusa/server/public/admin/index.html` exists after build.
- Runtime starts from the isolated Medusa app root.
- Runtime does not depend on host `.medusa` or host `node_modules`.
- Runtime includes only what it needs to start and healthcheck.

Storefront image:

- Builds only the storefront package.
- Starts from the storefront app root.
- Does not run Medusa backend commands.

## Health and readiness

- Postgres healthcheck should use `pg_isready`.
- Redis healthcheck should use `redis-cli ping`.
- Backend healthcheck should use Node-based HTTP probing against local backend health endpoint.
- Storefront healthcheck should use Node-based HTTP probing against local Next.js endpoint.
- `/health` should mean process is alive.
- `/ready` should mean dependency readiness when implemented.
- Do not install curl/wget only for healthchecks unless Node-based probing is impossible.

## Reverse proxy rules

Public routing:

- Admin/backend public hostname routes to backend container port `9000`.
- Storefront public hostname routes to storefront container port `8000`.
- Dev HMR websocket routing is only for dev profile.

Required HTTPS proxy headers:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port 443;
```

Rules:

- Do not route production browser traffic to Vite random ports.
- Do not expose firewall/admin UI through application subdomains.
- Browser-facing app envs must match the hostnames users actually visit.

## Validation commands

```sh
docker compose config
docker compose build --no-cache
docker compose up -d
docker compose ps
docker logs medusa_backend --tail=150
docker logs medusa_storefront --tail=150
```

Backend runtime validation:

```sh
docker exec -it medusa_backend sh -lc 'pwd && node -p "process.cwd()" && ls -la .medusa/server/public/admin/index.html'
docker inspect medusa_backend --format '{{json .Mounts}}'
```

Storefront runtime validation:

```sh
docker exec -it medusa_storefront sh -lc 'pwd && node -p "require(\"./package.json\").name"'
```

## Common failure patterns

### Admin bundle exists but Medusa cannot find it

Check runtime root alignment before copying files around. The backend production container should run from the isolated Medusa app root where `.medusa/server/public/admin/index.html` exists.

### Browser requests Docker service name

This means a public URL leak. Fix app env/config and rebuild browser bundles.

### Login loop behind HTTPS proxy

Check cookie attributes, exact CORS/auth origins, stable secrets, and forwarded HTTPS headers before changing code.
