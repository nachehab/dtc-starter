# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps
WORKDIR /server
RUN corepack enable && corepack prepare pnpm@10.11.1 --activate

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

WORKDIR /server/apps/backend

RUN pnpm build

# HARD FAIL if admin not built
RUN echo "Checking Admin build..." && \
    find /server/apps/backend/.medusa -name index.html -print && \
    test -f "$(find /server/apps/backend/.medusa -name index.html | head -n 1)"

FROM node:20-alpine AS runner
WORKDIR /server
RUN corepack enable && corepack prepare pnpm@10.11.1 --activate

ENV NODE_ENV=production
ENV PORT=9000
ENV DISABLE_MEDUSA_ADMIN=false

COPY --from=builder /server /server

WORKDIR /server/apps/backend

EXPOSE 9000

CMD ["pnpm", "start"]
