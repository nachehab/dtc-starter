# Storefront AGENTS.md - Next.js Storefront Compliance

Scope: `apps/storefront`, the Next.js storefront, checkout UI, product pages, client-safe SDK usage, browser asset handling, and storefront code.

This repository's Docker runtime is production-only for the Medusa backend. Keep storefront work modular and do not add storefront commands or mounts back into `docker-compose.yaml` unless the production topology is intentionally changed.

## Security Baseline

- Never commit real `apps/storefront/.env` values containing secrets.
- Treat every `NEXT_PUBLIC_*` value as public and browser-visible.
- Never place PayPal secrets, webhook IDs, SMTP credentials, Medusa secrets, database URLs, Redis URLs, cookie secrets, JWT secrets, or backend private URLs in storefront env or code.
- Do not log customer personal information, payment details, cart tokens, auth tokens, cookies, or checkout secrets.
- Do not switch browser-facing URLs to Docker service names, loopback hosts, LAN IPs, or HTTP origins.

## Storefront Env Reference

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

## Safe Commands

```sh
pnpm --filter @dtc/storefront lint
pnpm --filter @dtc/storefront build
npm run check-no-localhost
npm run check:public-urls
```
