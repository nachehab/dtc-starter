# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps

WORKDIR /server

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps/storefront/package.json ./apps/storefront/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS builder

COPY . .

ENV NODE_ENV=production

RUN --mount=type=secret,id=storefront_env,target=/server/apps/storefront/.env \
  pnpm --filter @dtc/storefront build

FROM node:20-alpine AS runner

WORKDIR /server/apps/storefront

RUN corepack enable

ENV NODE_ENV=production
ENV PORT=8000

COPY --from=builder /server /server

EXPOSE 8000

CMD ["pnpm", "start"]
