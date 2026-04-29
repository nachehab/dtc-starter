#!/bin/sh

echo "[medusa:dev-built-admin] building Medusa backend/admin once"
NODE_ENV=production DISABLE_MEDUSA_ADMIN=false MEDUSA_WORKER_MODE=server pnpm --filter @dtc/backend build || exit 1

echo "[medusa:dev-built-admin] locating admin build output"
find /server/apps/backend/.medusa -name index.html -print || true

if [ -f /server/apps/backend/.medusa/admin/index.html ]; then
  echo "[medusa:dev-built-admin] admin build found at .medusa/admin/index.html"
elif [ -f /server/apps/backend/.medusa/server/public/admin/index.html ]; then
  echo "[medusa:dev-built-admin] syncing admin build from .medusa/server/public/admin to .medusa/admin"
  mkdir -p /server/apps/backend/.medusa/admin
  cp -R /server/apps/backend/.medusa/server/public/admin/. /server/apps/backend/.medusa/admin/
else
  echo "[medusa:dev-built-admin] ERROR: admin index.html not found after build"
  find /server/apps/backend/.medusa -maxdepth 5 -type f | sort || true
  exit 1
fi

node /server/scripts/check-medusa-build-output.js || exit 1

echo "[medusa:dev-built-admin] running database migrations"
pnpm --filter @dtc/backend predeploy || exit 1

echo "[medusa:dev-built-admin] starting Medusa with built admin on port ${PORT:-9000}"
NODE_ENV=production DISABLE_MEDUSA_ADMIN=false MEDUSA_WORKER_MODE=server exec pnpm --filter @dtc/backend start
