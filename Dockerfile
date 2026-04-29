# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps

WORKDIR /server

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/storefront/package.json ./apps/storefront/package.json

RUN pnpm install --frozen-lockfile

# =========================
# BUILD STAGE
# =========================
FROM deps AS builder

WORKDIR /server

COPY . .

ENV NODE_ENV=production

# ? CRITICAL FIX: build backend (admin UI gets generated here)
RUN --mount=type=secret,id=backend_env,target=/server/apps/backend/.env \
  pnpm --filter @dtc/backend build

# optional but recommended (keeps prod consistent)
RUN --mount=type=secret,id=storefront_env,target=/server/apps/storefront/.env \
  pnpm --filter @dtc/storefront build

# =========================
# RUNTIME
# =========================
FROM node:20-alpine AS runner

WORKDIR /server/apps/backend

RUN corepack enable

ENV NODE_ENV=production
ENV PORT=9000

COPY --from=builder /server /server

EXPOSE 9000

CMD ["pnpm", "start"]