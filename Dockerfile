# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps

WORKDIR /server

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/storefront/package.json ./apps/storefront/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS builder

WORKDIR /server

COPY . .

ENV NODE_ENV=production
ENV DISABLE_MEDUSA_ADMIN=false
ENV MEDUSA_WORKER_MODE=server

RUN --mount=type=secret,id=backend_env,target=/server/apps/backend/.env \
  pnpm --filter @dtc/backend build && \
  node scripts/check-medusa-build-output.js

FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable

ENV NODE_ENV=production
ENV PORT=9000
ENV DISABLE_MEDUSA_ADMIN=false
ENV MEDUSA_WORKER_MODE=server

COPY --from=builder /server/apps/backend ./
COPY --from=builder /server/node_modules ./node_modules

EXPOSE 9000

CMD ["pnpm", "start"]
