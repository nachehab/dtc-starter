# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps

WORKDIR /server

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps/backend/package.json ./apps/backend/package.json

RUN pnpm install --frozen-lockfile --filter @dtc/backend...

FROM deps AS builder

WORKDIR /server

COPY scripts/check-medusa-build-output.js ./scripts/check-medusa-build-output.js
COPY . .

ENV NODE_ENV=production
ENV DISABLE_MEDUSA_ADMIN=false
ENV MEDUSA_WORKER_MODE=server

RUN --mount=type=secret,id=backend_env,target=/server/apps/backend/.env \
  pnpm --filter @dtc/backend build && \
  node scripts/check-medusa-build-output.js

FROM node:20-alpine AS runner

WORKDIR /server/apps/backend

RUN corepack enable

ENV NODE_ENV=production
ENV PORT=9000
ENV DISABLE_MEDUSA_ADMIN=false
ENV MEDUSA_WORKER_MODE=server
ENV HEALTHCHECK_URL=http://127.0.0.1:9000/health

COPY --from=builder /server/apps/backend /server/apps/backend
COPY --from=builder /server/node_modules /server/node_modules
COPY --from=builder /server/scripts/check-medusa-health.js /server/scripts/check-medusa-health.js

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD node /server/scripts/check-medusa-health.js

CMD ["pnpm", "start"]
