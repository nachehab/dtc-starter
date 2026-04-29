# Storefront AGENTS.md — Next.js Storefront Compliance

Scope: `apps/storefront`, the Next.js storefront, checkout UI, product pages, client-safe SDK usage, browser asset handling, and storefront Docker image.

Read `../../AGENTS.md`, `../../README.md`, and this file before changing storefront env, checkout, image, Docker, or public URL behavior.

## Security baseline

- Never commit real `apps/storefront/.env` values containing secrets.
- Treat every `NEXT_PUBLIC_*` value as public and browser-visible.
- Never place PayPal secrets, webhook IDs, SMTP credentials, Medusa secrets, database URLs, Redis URLs, cookie secrets, JWT secrets, or backend private URLs in storefront env or code.
- Do not log customer personal information, payment details, cart tokens, auth tokens, cookies, or checkout secrets.
- Do not bypass CORS/auth errors by switching browser-facing URLs to Docker service names, localhost, LAN IPs, or HTTP origins.

## Storefront env reference

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

- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` must be a public HTTPS backend/admin origin for deployed browser use.
- `NEXT_PUBLIC_BASE_URL` must be a public HTTPS storefront origin.
- `NEXT_PUBLIC_ASSET_BASE_URL` must be a public HTTPS asset/backend origin when set.
- `MEDUSA_BACKEND_URL` may be server-only, but should not cause generated browser assets to contain Docker-only URLs.
- Do not use localhost, loopback, LAN IPs, Docker service names, or random dev ports in browser-facing values.

## Next.js compliance rules

- Keep the storefront runtime in `apps/storefront`.
- Do not move scripts or runtime paths to the monorepo root.
- Do not import backend-only modules, Node-only secrets, or server-only envs into client components.
- Treat production build, lint, and TypeScript failures as blockers.
- Fix lint and type errors directly. Do not disable lint globally to pass a build.
- Prefer explicit types for products, carts, regions, checkout sessions, and payment flows.
- Use `unknown` plus runtime narrowing for untrusted API responses.
- Avoid broad `as any` casts. Narrow casts must be local and justified.

## Module agents

### Public URL and asset agent

Responsibilities:

- Ensure product images, `/static` URLs, and Medusa upload URLs resolve to browser-reachable public HTTPS origins.
- Normalize asset URLs through public backend/asset origin helpers before rendering.
- Prevent `http://medusa:9000`, `localhost`, LAN IPs, or private origins from appearing in generated HTML/JS.
- Rebuild Docker or clear stale `.next` output when public env values change.

Validation:

```sh
npm run check-no-localhost
npm run check:public-urls
```

### Checkout/payment UI agent

Responsibilities:

- Keep backend payment creation, capture, and webhook handling on the Medusa backend.
- Storefront may use public client IDs only, such as `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
- Never expose `PAYPAL_CLIENT_SECRET`, webhook IDs, provider credentials, or backend tokens.
- Checkout components must handle disabled/missing PayPal public client ID gracefully.
- Payment UI should fail closed with a useful customer-safe message, not leak stack traces or credentials.

### Medusa SDK/data agent

Responsibilities:

- Use the public Medusa backend URL and publishable API key as documented by Medusa storefront patterns.
- Keep customer/cart tokens client-safe and never print them in logs.
- Do not bypass Medusa auth/session behavior by calling private admin APIs from the storefront.
- Keep data fetching typed and scoped to storefront-safe endpoints.

### Docker storefront agent

Responsibilities:

- Storefront Dockerfile builds only the storefront package.
- Runtime should start from the storefront app root with `pnpm start`.
- Production compose must not bind-mount source or expose dev/HMR ports.
- Healthcheck should verify the Next.js server responds without relying on extra Alpine packages.

## Safe commands

From repo root:

```sh
pnpm --filter @dtc/storefront lint
pnpm --filter @dtc/storefront build
docker compose build --no-cache storefront
docker compose up -d storefront
docker logs medusa_storefront --tail=150
```

## Common failures

### `no-explicit-any` in payment or SDK code

- Replace `any` with SDK types when available.
- If SDK types are unavailable, define a minimal local interface for the fields used.
- Use `unknown` and object-shape checks for external payloads.

### Build fails after successful compile

- Read the first lint/type error after compile output.
- Run lint separately for faster feedback.
- Check env values if the error references URL, image, or metadata config.

### Browser requests `http://medusa:9000`

This is a public URL leak. Fix env/config so browser-facing values use public HTTPS origins. Docker service names are internal only.
