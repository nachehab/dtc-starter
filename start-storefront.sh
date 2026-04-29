#!/bin/sh
set -e

cd "$(dirname "$0")"

exec corepack pnpm --filter @dtc/storefront start
