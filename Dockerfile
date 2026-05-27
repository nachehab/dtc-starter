# syntax=docker/dockerfile:1.7

FROM node:20-alpine

WORKDIR /server

RUN corepack enable && corepack prepare pnpm@10.11.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/storefront/package.json ./apps/storefront/package.json

RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV PORT=9000
ENV DISABLE_MEDUSA_ADMIN=false
ENV MEDUSA_WORKER_MODE=server

WORKDIR /server/apps/backend

RUN --mount=type=secret,id=backend_env,target=/server/apps/backend/.env \
    pnpm build

EXPOSE 9000

CMD ["pnpm", "start"]
