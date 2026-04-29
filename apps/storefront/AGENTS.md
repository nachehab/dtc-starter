# Storefront AGENTS.md - Next.js Storefront Compliance

Scope: `apps/storefront`, the Next.js storefront, checkout UI, product pages, client-safe SDK usage, browser asset handling, and storefront Docker image.

Read `../../AGENTS.md`, `../../README.md`, and this file before changing storefront env, checkout, image, Docker, or public URL behavior.

## Security Baseline

- Never commit real `apps/storefront/.env` values containing secrets.
- Treat every `NEXT_PUBLIC_*` value as public and browser-visible.
- Never place PayPal secrets, webhook IDs, SMTP credentials, Medusa secrets, database URLs, Redis URLs, cookie secrets, JWT secrets, or backend private URLs in storefront env or code.
- Do not log customer personal information, payment details, cart tokens, auth tokens, cookies, or checkout secrets.
- Do not bypass CORS/auth errors by switching browser-facing URLs to Docker service names.

## Storefront Env Reference

Storefront env belongs in `apps/storefront/.env`. Templates may be committed; real values stay local.

Browser-exposed values:

- `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- `NEXT_PUBLIC_ASSET_BASE_URL`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_DEFAULT_REGION`
- `NEXT_PUBLIC_STRIPE_KEY`
- `NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `NEXT_PUBLIC_VERCEL_URL`

Server-only storefront value:

- `MEDUSA_BACKEND_URL`

Optional image host settings:

- `MEDUSA_CLOUD_S3_HOSTNAME`
- `MEDUSA_CLOUD_S3_PATHNAME`

Rules:

- Local Docker defaults may use `http://192.168.86.176`, `localhost`, and `127.0.0.1` through env files.
- Browser-facing env values must be reachable from the browser that loads the storefront.
- Do not use Docker service names such as `medusa`, `postgres`, or `redis` in browser-facing values.

## Next.js Rules

- Keep the storefront runtime in `apps/storefront`.
- Do not move scripts or runtime paths to the monorepo root.
- Do not import backend-only modules, Node-only secrets, or server-only envs into client components.
- Treat production build, lint, and TypeScript failures as blockers.
- Preserve storefront UI, branding, Tailwind, public assets, product, cart, checkout, and data customizations unless a task explicitly targets them.
- Keep data fetching typed and scoped to storefront-safe endpoints.

## Checkout/Payment UI

- Keep backend payment creation, capture, and webhook handling on the Medusa backend.
- Storefront may use public client IDs only, such as `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
- Never expose `PAYPAL_CLIENT_SECRET`, webhook IDs, provider credentials, or backend tokens.
- Checkout components must handle disabled/missing PayPal public client ID gracefully.

## Docker

- Storefront Dockerfile builds only the storefront package.
- Runtime should start from the storefront app root with `pnpm start`.
- Production compose must not bind-mount source or expose dev/HMR ports.
- Healthcheck should verify the Next.js server responds without relying on extra Alpine packages.

## Safe Commands

From repo root:

```sh
pnpm --filter @dtc/storefront lint
pnpm --filter @dtc/storefront build
docker compose build --no-cache storefront
docker compose up -d storefront
docker logs medusa_storefront --tail=150
```
