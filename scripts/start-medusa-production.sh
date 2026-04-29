#!/bin/sh

set -e

echo "[medusa:start] running database migrations"
pnpm --filter @dtc/backend predeploy

echo "[medusa:start] starting Medusa server"
exec pnpm --filter @dtc/backend start
