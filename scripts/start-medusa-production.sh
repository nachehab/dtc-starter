#!/bin/sh
set -eu

echo "[medusa:start] validating runtime environment"
node /server/scripts/check-env-files.js
node /server/scripts/check-public-urls.js

echo "[medusa:start] running database migrations"
pnpm --filter @dtc/backend predeploy

echo "[medusa:start] starting Medusa server"
exec pnpm --filter @dtc/backend start
