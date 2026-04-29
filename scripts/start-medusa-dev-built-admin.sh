#!/bin/sh

echo "[medusa:dev-built-admin] installing/validating workspace dependencies"
pnpm install --frozen-lockfile || exit 1

echo "[medusa:dev-built-admin] building Medusa backend/admin once"
NODE_ENV=production DISABLE_MEDUSA_ADMIN=false MEDUSA_WORKER_MODE=server pnpm --filter @dtc/backend build || exit 1
node /server/scripts/check-medusa-build-output.js || exit 1

echo "[medusa:dev-built-admin] running database migrations"
pnpm --filter @dtc/backend predeploy || exit 1

echo "[medusa:dev-built-admin] starting Medusa with built admin on port ${PORT:-9000}"
NODE_ENV=production DISABLE_MEDUSA_ADMIN=false MEDUSA_WORKER_MODE=server exec pnpm --filter @dtc/backend start
