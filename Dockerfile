# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps

WORKDIR /server

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps/backend/package.json ./apps/backend/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS builder

WORKDIR /server

COPY . .

ENV NODE_ENV=production
ENV DISABLE_MEDUSA_ADMIN=false
ENV MEDUSA_WORKER_MODE=server

RUN --mount=type=secret,id=backend_env,target=/server/apps/backend/.env \
  pnpm --filter @dtc/backend build

FROM node:20-alpine AS runner

WORKDIR /server/apps/backend

RUN corepack enable

ENV NODE_ENV=production
ENV PORT=9000
ENV DISABLE_MEDUSA_ADMIN=false
ENV MEDUSA_WORKER_MODE=server

COPY --from=builder /server /server

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD node -e "const http=require('http');const req=http.get('http://127.0.0.1:9000/health',res=>process.exit(res.statusCode<400?0:1));req.on('error',()=>process.exit(1));req.setTimeout(5000,()=>req.destroy());"

CMD ["pnpm", "start"]
