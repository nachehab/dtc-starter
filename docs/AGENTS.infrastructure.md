# Infrastructure AGENTS.md - Docker, Compose, Reverse Proxy, and Operations

Scope: root Docker files, Docker Compose, production runtime topology, reverse proxy assumptions, healthchecks, readiness, public URL routing, and operational validation.

## Security Baseline

- Do not commit real `.env` files, proxy certificates, private keys, API secrets, app passwords, database dumps, or production logs with credentials.
- Do not print secrets in Docker logs, validation output, docs, comments, or issue bodies.
- Compose should reference app-scoped env files; do not inline production secrets directly into `docker-compose.yaml`.
- Browser-facing values must be public HTTPS origins. Docker service names are internal only.

## Production Compose Rules

Production compose is `docker-compose.yaml`.

Required behavior:

- Uses built images.
- Does not bind-mount source into app containers.
- Publishes backend port `9000`.
- Loads backend env from `apps/backend/.env`.
- Keeps Postgres state in named volume `postgres_data`.
- Uses `depends_on.condition: service_healthy` only where the dependency has a real healthcheck.

Forbidden: host source-tree bind mounts into application containers.

## Dockerfile Rules

Backend image:

- Install dependencies with pnpm/Corepack.
- Build backend/admin with `pnpm build` from `apps/backend`.
- Validate an Admin `index.html` exists after build.
- Runtime starts from `/server/apps/backend`.
- Runtime does not depend on host `.medusa` or host `node_modules`.

## Reverse Proxy Rules

Public routing:

- Admin/backend public hostname routes to backend container port `9000`.

Required HTTPS proxy headers:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port 443;
```

## Validation Commands

```sh
docker compose config
docker compose build --no-cache medusa
docker compose up -d postgres redis medusa
docker compose ps
docker logs medusa_backend --tail=150
docker exec -it medusa_backend sh -lc 'pwd && node -p "process.cwd()" && find .medusa -name index.html -print'
docker inspect medusa_backend --format '{{json .Mounts}}'
```
