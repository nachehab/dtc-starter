# Troubleshooting Agent Guide

Use this guide for operational debugging. Keep diagnostics sanitized: never print secrets, full cookies, tokens, SMTP passwords, PayPal secrets, or database credentials.

## 1. Admin Login Loop

Symptoms:

- Browser cycles through `/app/login`, `/cloud/auth`, `/app/?token`, and `/app`.
- Login appears successful, but the admin returns to login.
- `connect.sid` is missing or not retained.

Checklist:

- Confirm backend env uses public HTTPS origins:
  - `PUBLIC_BACKEND_URL`
  - `MEDUSA_BACKEND_URL`
  - `MEDUSA_ADMIN_BACKEND_URL`
  - `STORE_CORS`
  - `ADMIN_CORS`
  - `AUTH_CORS`
- Confirm `COOKIE_SECRET` and `JWT_SECRET` exist and did not change unexpectedly.
- Confirm Medusa cookie config remains:
  - `sameSite: "none"`
  - `secure: true`
- Confirm browser cookie:

```text
Browser DevTools -> Application -> Cookies -> ridersadmin.nchehab.ddns.net -> connect.sid must exist with Secure=true and SameSite=None.
```

- Confirm reverse proxy forwards:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port 443;
```

- Confirm admin traffic routes to `medusa:9000`, not a random Vite port.
- Confirm CORS values are exact public origins, not comma entries with whitespace mistakes unless explicitly supported by the code path.

Commands:

```sh
docker compose exec medusa printenv | grep -E "PUBLIC_BACKEND_URL|MEDUSA_BACKEND_URL|MEDUSA_ADMIN_BACKEND_URL|STORE_CORS|ADMIN_CORS|AUTH_CORS|COOKIE_SECRET|JWT_SECRET"
docker logs medusa_backend
docker compose config
```

Redact secret values before sharing output.

## 2. Email Test Failure

Checklist:

- Confirm `EMAIL_PROVIDER=gmail` when testing Gmail SMTP.
- Confirm `EMAIL_ENABLED=true` when expecting real SMTP delivery.
- Confirm `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` are present.
- Confirm `SITE_PUBLIC_URL` and `ADMIN_PUBLIC_URL` are public HTTPS origins.
- Confirm `nodemailer` is in backend dependencies.
- Confirm `@types/nodemailer` is in backend dev dependencies.
- Confirm the backend container was rebuilt after dependency or lockfile changes.
- Never print `SMTP_PASS`.

Commands:

```sh
pnpm --filter @dtc/backend email:test
docker compose exec medusa printenv | grep -E "EMAIL_PROVIDER|EMAIL_ENABLED|SMTP_HOST|SMTP_PORT|SMTP_SECURE|SMTP_USER|SMTP_FROM|SITE_PUBLIC_URL|ADMIN_PUBLIC_URL"
docker logs medusa_backend
```

Common fix for missing dependency:

```sh
pnpm install --frozen-lockfile
docker compose build --no-cache medusa
docker compose up -d medusa
```

## 3. Storefront Build Failure

Checklist:

- Run lint first for faster feedback.
- Remember that `next build` can fail after successful compile because lint/type validation still runs.
- Fix TypeScript and ESLint errors directly.
- Avoid `any`; use explicit types or `unknown` with narrowing.
- Check PayPal service files for `no-explicit-any`.
- Confirm `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_ASSET_BASE_URL`, and `NEXT_PUBLIC_BASE_URL` are public HTTPS origins.
- Clear `.next` or rebuild Docker if public env values changed.

Commands:

```sh
pnpm --filter @dtc/storefront lint
pnpm --filter @dtc/storefront build
npm run check-no-localhost
npm run check:public-urls
```

Docker rebuild after build-time env or dependency changes:

```sh
docker compose build --no-cache storefront
docker compose up -d storefront
docker logs medusa_storefront
```

## 4. Docker Dev/Prod Confusion

Checklist:

- Production uses:

```sh
docker compose up -d --build
```

- Dev/live reload uses:

```sh
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --profile dev up
```

- Confirm `docker-compose.dev.yaml` only changes live reload behavior, bind mounts, polling, dev commands, and dev-only HMR exposure.
- Confirm dev override does not duplicate CORS, auth URLs, public URLs, cookie/JWT secrets, database URLs, Redis URLs, PayPal secrets, or SMTP secrets.
- Confirm production publishes only `9000` and `8000` unless intentionally changed.
- Confirm dev exposes `5173` only for Vite/HMR.

Commands:

```sh
docker compose config
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --profile dev config
docker compose ps
```

## 5. Public URL Leaks

Symptoms:

- Browser requests `localhost`, `127.0.0.1`, a LAN IP, a Docker service name, or an unexpected port.
- Product images point to local origins.
- Admin HMR tries a random port through the browser.

Checklist:

- Confirm `NEXT_PUBLIC_*` and `VITE_PUBLIC_*` values are public HTTPS origins.
- Confirm `PUBLIC_BACKEND_URL` and `PUBLIC_ASSET_BASE_URL` are public HTTPS backend/admin origins.
- Confirm Medusa local file provider uses `PUBLIC_BACKEND_URL` for `/static`.
- Check existing DB image URLs and run the image URL fix workflow if old origins are present.
- Rebuild or clear storefront build cache after public env changes.

Commands:

```sh
npm run check-no-localhost
npm run check:public-urls
npm run fix-image-urls
docker compose exec storefront printenv | sort
docker compose exec medusa printenv | sort
```

Redact secrets before sharing env output.

## 6. Mixed Content Errors

Symptoms:

- HTTPS storefront/admin tries to load HTTP images, API calls, scripts, or HMR websocket URLs.
- Browser blocks requests as mixed content.

Checklist:

- Confirm browser-facing origins are `https://`.
- Confirm admin HMR uses `wss`, public host, and port `443` behind the reverse proxy.
- Confirm `/static` image URLs are normalized to the public asset base URL.
- Confirm no Docker service URL or `http://` internal origin reaches client code.
- Confirm reverse proxy terminates TLS and forwards `X-Forwarded-Proto=https`.

Commands:

```sh
npm run check-no-localhost
npm run check:public-urls
docker compose exec medusa printenv | grep -E "PUBLIC_BACKEND_URL|PUBLIC_ASSET_BASE_URL|VITE_HMR_PROTOCOL|VITE_HMR_HOST|VITE_HMR_CLIENT_PORT"
docker compose exec storefront printenv | grep -E "NEXT_PUBLIC_MEDUSA_BACKEND_URL|NEXT_PUBLIC_ASSET_BASE_URL|NEXT_PUBLIC_BASE_URL"
```

## 7. PayPal Webhook or Payment Issues

Checklist:

- Confirm backend env:
  - `PAYPAL_CLIENT_ID`
  - `PAYPAL_CLIENT_SECRET`
  - `PAYPAL_WEBHOOK_ID`
  - `PAYPAL_API_BASE_URL`
  - `PAYPAL_ENVIRONMENT`
  - `PAYPAL_AUTO_CAPTURE`
- Confirm storefront env:
  - `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- Confirm webhook URL:

```text
{PUBLIC_BACKEND_URL}/hooks/payment/paypal_paypal
```

- Confirm backend PayPal secrets are not present in storefront env or client bundle.
- Confirm public backend URL is reachable by PayPal over HTTPS.
- Confirm PayPal environment matches the credentials being used.
- Confirm TypeScript types in PayPal service files do not rely on broad `any`.

Commands:

```sh
pnpm --filter @dtc/backend build
pnpm --filter @dtc/storefront lint
pnpm --filter @dtc/storefront build
docker logs medusa_backend
```

## Production Validation

```sh
docker compose down
docker compose build --no-cache
docker compose up -d
docker logs medusa_backend
docker logs medusa_storefront
```

## Dev Validation

```sh
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --profile dev up
```

## URL Leak Checks

```sh
npm run check-no-localhost
npm run check:public-urls
```

## Container Env Check

```sh
docker compose exec medusa printenv | sort
docker compose exec storefront printenv | sort
```

Before sharing output, redact secrets and credentials.
