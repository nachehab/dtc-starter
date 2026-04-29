# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps

WORKDIR /server

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps/storefront/package.json ./apps/storefront/package.json

RUN pnpm install --frozen-lockfile --filter @dtc/storefront...

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

COPY --from=builder /server/package.json /server/package.json
COPY --from=builder /server/pnpm-lock.yaml /server/pnpm-lock.yaml
COPY --from=builder /server/pnpm-workspace.yaml /server/pnpm-workspace.yaml
COPY --from=builder /server/node_modules /server/node_modules
COPY --from=builder /server/apps/storefront /server/apps/storefront

EXPOSE 8000

CMD ["pnpm", "start"]
