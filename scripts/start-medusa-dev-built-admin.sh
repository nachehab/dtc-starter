#!/bin/sh
set -eu

cd /server/apps/backend

echo "[medusa:dev] running database migrations"
pnpm medusa db:migrate

echo "[medusa:dev] starting Medusa develop on port ${PORT:-9000}"
exec pnpm dev
