# Storefront Agent Guide

Scope: `apps/storefront`, the Next.js storefront.

Read `README.md`, `../../README.md`, and `../../AGENTS.md` before changing storefront build, env, checkout, image, or Docker behavior.

## Storefront Env Reference

Storefront env belongs in `apps/storefront/.env`. Use `apps/storefront/.env.example`, `.env.template`, `.env.development.template`, or `.env.production.template` as references. Do not commit real secrets.

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

- Every `NEXT_PUBLIC_*` value is bundled into browser-visible code.
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` must be a public HTTPS backend/admin origin.
- `NEXT_PUBLIC_BASE_URL` must be a public HTTPS storefront origin.
- `NEXT_PUBLIC_ASSET_BASE_URL` must be a public HTTPS asset/backend origin when set.
- Do not place PayPal secrets, Medusa secrets, SMTP credentials, database URLs, Redis URLs, or cookie/JWT secrets in storefront env.
- Do not use localhost, loopback, LAN IPs, Docker service names, or random dev ports in browser-facing values.

## Next.js Build Rules

- Keep the storefront runtime in `apps/storefront`.
- Do not move scripts or runtime paths to the monorepo root.
- Treat production build failures as blockers.
- A successful compile is not enough: `next build` can still fail during lint or type validation.
- Fix lint and type issues directly. Do not disable lint globally to pass a build.
- Rebuild Docker after Dockerfile, package, lockfile, or build-time public env changes.
- Clear `.next` or rebuild the image when public env values change and stale bundles are suspected.

Safe commands from the repo root:

```sh
pnpm --filter @dtc/storefront lint
pnpm --filter @dtc/storefront build
docker compose build --no-cache storefront
docker compose up -d storefront
```

## PayPal Browser Rules

- The only PayPal browser env currently expected here is `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
- Never expose `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, or backend API credentials to storefront code.
- Keep PayPal service files explicitly typed.
- Avoid `any`; use explicit SDK types or `unknown` with runtime narrowing.
- Ensure checkout code handles missing PayPal public client ID gracefully when PayPal is disabled.
- Keep backend payment creation, capture, and webhook handling on the Medusa backend.

## Asset URL and Public Backend URL Rules

- Product image URLs, `/static` URLs, and Medusa upload URLs must resolve to browser-reachable public HTTPS origins.
- Use `NEXT_PUBLIC_MEDUSA_BACKEND_URL` and `NEXT_PUBLIC_ASSET_BASE_URL` for browser-facing backend and asset references.
- Do not let container-only URLs such as `http://medusa:9000` reach client components, generated HTML, image config, or JavaScript bundles.
- When backend public asset settings change, rebuild or clear stale storefront build output.
- Run leak checks after frontend/admin builds:

```sh
npm run check-no-localhost
npm run check:public-urls
```

## Lint and Type Expectations

- Prefer explicit types for Medusa SDK, PayPal SDK, cart, checkout, product, and region data.
- Use `unknown` plus type narrowing for untrusted API responses.
- Avoid broad `as any` casts.
- Do not silence `no-explicit-any` globally.
- Narrow ESLint disables are acceptable only with a short reason and only when the type cannot be expressed cleanly.
- Keep code modular by feature area: checkout logic, PayPal components, product data, and URL helpers should not be collapsed into one large file.

## Common Failure: `no-explicit-any` in PayPal Service

Checklist:

- Replace `any` with PayPal SDK types when available.
- If SDK types are unavailable, define a local minimal interface for the fields used.
- For unknown response payloads, use `unknown` and check object shape before reading fields.
- Keep browser-safe PayPal values limited to `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.

Validation:

```sh
pnpm --filter @dtc/storefront lint
pnpm --filter @dtc/storefront build
```

## Common Failure: Build Fails After Successful Compile

Likely cause: Next.js compiled pages, then lint or TypeScript validation failed.

Checklist:

- Read the first lint/type error after the compile output.
- Fix the source issue instead of disabling validation globally.
- Re-run lint before build for faster feedback:

```sh
pnpm --filter @dtc/storefront lint
pnpm --filter @dtc/storefront build
```

- If the error mentions env values, inspect `apps/storefront/.env` and confirm public values are HTTPS public origins.
