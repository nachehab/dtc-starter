# Ayden Medusa Store

Medusa v2 backend plus a Next.js storefront, packaged as a small monorepo for local Docker development and portable deployment. All environment-specific URLs live in env files or shell-provided Docker variables.

## Architecture

```mermaid
flowchart LR
  Browser["Browser"] --> Storefront["Next.js storefront"]
  Browser --> Admin["Medusa admin"]
  Storefront --> Backend["Medusa backend"]
  Admin --> Backend
  Backend --> DB["Postgres"]
  Backend --> Cache["Redis"]
  Backend --> Files["Local static files"]
```

## Environment Setup

Use the app-specific templates as the source of truth. Development and production intentionally share the same public domains, auth secrets, CORS values, and reverse-proxy assumptions.
For Docker development:

```sh
cp apps/backend/.env.development.template apps/backend/.env
cp apps/storefront/.env.development.template apps/storefront/.env
```

For Docker production:

```sh
cp apps/backend/.env.production.template apps/backend/.env
cp apps/storefront/.env.production.template apps/storefront/.env
```

For the shared app-scoped reference:

```sh
cp apps/backend/.env.template apps/backend/.env
cp apps/storefront/.env.template apps/storefront/.env
```

`.env.example` documents the full union of supported variables, but it should not be copied wholesale into both apps. Backend-only values belong in `apps/backend/.env`; storefront browser values belong in `apps/storefront/.env`.

Minimum backend values:

```env
PUBLIC_BACKEND_URL=https://ridersadmin.nchehab.ddns.net
MEDUSA_BACKEND_URL=https://ridersadmin.nchehab.ddns.net
MEDUSA_ADMIN_BACKEND_URL=https://ridersadmin.nchehab.ddns.net
DATABASE_URL=postgres://postgres:postgres@postgres:5432/medusa-store
REDIS_URL=redis://redis:6379
CACHE_REDIS_URL=redis://redis:6379
LOCKING_REDIS_URL=redis://redis:6379
STORE_CORS=https://ridersparadise.nchehab.ddns.net,https://ridersadmin.nchehab.ddns.net
ADMIN_CORS=https://ridersadmin.nchehab.ddns.net
AUTH_CORS=https://ridersadmin.nchehab.ddns.net,https://ridersparadise.nchehab.ddns.net
JWT_SECRET=<secure-random-value>
COOKIE_SECRET=<secure-random-value>
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
TRUST_PROXY=1
DISABLE_MEDUSA_ADMIN=false
MEDUSA_WORKER_MODE=server
PORT=9000
```

Minimum storefront values:

```env
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://ridersadmin.nchehab.ddns.net
MEDUSA_BACKEND_URL=https://ridersadmin.nchehab.ddns.net
NEXT_PUBLIC_BASE_URL=https://ridersparadise.nchehab.ddns.net
NEXT_PUBLIC_ASSET_BASE_URL=https://ridersadmin.nchehab.ddns.net
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=
NEXT_PUBLIC_DEFAULT_REGION=ca
```

Optional PayPal values:

```env
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_API_BASE_URL=
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_AUTO_CAPTURE=false
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
```

Optional Gmail SMTP email values:

```env
EMAIL_PROVIDER=gmail
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SITE_PUBLIC_URL=<public-storefront-origin>
ADMIN_PUBLIC_URL=<public-backend-origin>
CONTACT_TO_EMAIL=
EMAIL_ENABLED=true
```

`PUBLIC_BACKEND_URL` is the canonical public backend origin. It must be reachable by the browser because local file uploads are saved with this value. Do not switch auth, CORS, cookie, or admin backend URL values between dev and production.

## Environment Reference

Backend env file: `apps/backend/.env`

| Variable                       | Purpose                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `PUBLIC_BACKEND_URL`           | Canonical public backend origin; required for uploaded image URLs.                                          |
| `MEDUSA_BACKEND_URL`           | Canonical public backend origin. Keep equal to `PUBLIC_BACKEND_URL`.                                        |
| `MEDUSA_ADMIN_BACKEND_URL`     | Public backend origin baked into the Medusa admin build. Keep equal to `PUBLIC_BACKEND_URL`.                |
| `DATABASE_URL`                 | Backend database connection. Use `postgres` as host inside Docker.                                          |
| `REDIS_URL`                    | Backend Redis connection. Use `redis` as host inside Docker.                                                |
| `CACHE_REDIS_URL`              | Redis connection used by the Medusa Redis caching provider. Falls back to `REDIS_URL` in config when unset. |
| `LOCKING_REDIS_URL`            | Redis connection used by the Medusa Redis locking provider. Falls back to `REDIS_URL` in config when unset. |
| `STORE_CORS`                   | Browser storefront origins allowed to call store APIs.                                                      |
| `ADMIN_CORS`                   | Browser admin origins allowed to call admin APIs.                                                           |
| `AUTH_CORS`                    | Browser origins allowed for auth flows.                                                                     |
| `JWT_SECRET`                   | Backend JWT signing secret.                                                                                 |
| `COOKIE_SECRET`                | Backend cookie signing secret.                                                                              |
| `COOKIE_SAME_SITE`             | Session cookie SameSite policy. Use `none` behind the HTTPS reverse proxy.                                  |
| `COOKIE_SECURE`                | Whether session cookies require HTTPS. Defaults from `PUBLIC_BACKEND_URL`; set `true` for this deployment.  |
| `TRUST_PROXY`                  | Express reverse-proxy trust hop count. Use `1` for the HTTPS proxy in front of Docker.                      |
| `ADMIN_SESSION_COOKIE_DEBUG`   | Enables sanitized admin/auth cookie diagnostics. Use `true` only while debugging.                           |
| `VITE_HOST`                    | Medusa admin Vite bind host.                                                                                |
| `VITE_ORIGIN`                  | Public admin/backend origin used by Vite.                                                                   |
| `VITE_ALLOWED_HOSTS`           | Additional admin Vite allowed hosts for LAN/proxy development.                                              |
| `VITE_HMR_HOST`                | Browser-reachable HMR host for the admin.                                                                   |
| `VITE_HMR_CLIENT_PORT`         | Browser-reachable HMR port for the admin.                                                                   |
| `DB_NAME`                      | Optional Medusa database name metadata.                                                                     |
| `MEDUSA_ADMIN_ONBOARDING_TYPE` | Medusa admin onboarding behavior.                                                                           |
| `DISABLE_MEDUSA_ADMIN`         | Set to `false` for the server container so the admin is included.                                           |
| `MEDUSA_WORKER_MODE`           | Medusa deployment mode. Use `server` for this production compose service.                                   |
| `PORT`                         | Medusa HTTP port. The production compose service uses `9000`.                                               |
| `PAYPAL_CLIENT_ID`             | PayPal backend app client ID.                                                                               |
| `PAYPAL_CLIENT_SECRET`         | PayPal backend app secret.                                                                                  |
| `PAYPAL_WEBHOOK_ID`            | PayPal webhook ID for signature validation.                                                                 |
| `PAYPAL_API_BASE_URL`          | PayPal API origin used for webhook signature verification when a webhook ID is configured.                  |
| `PAYPAL_ENVIRONMENT`           | `sandbox` or `production`.                                                                                  |
| `PAYPAL_AUTO_CAPTURE`          | Whether PayPal payments should capture immediately.                                                         |
| `EMAIL_PROVIDER`               | Email provider selector. Use `gmail` for the Gmail SMTP Notification Module provider.                       |
| `SMTP_HOST`                    | SMTP host for transactional email.                                                                          |
| `SMTP_PORT`                    | SMTP port, typically `587` for Gmail STARTTLS.                                                              |
| `SMTP_SECURE`                  | Whether SMTP uses an implicit TLS connection. Use `false` for port `587`.                                   |
| `SMTP_USER`                    | Gmail address used to authenticate SMTP.                                                                    |
| `SMTP_PASS`                    | Gmail App Password. Never commit a real password.                                                           |
| `SMTP_FROM`                    | From header for outbound transactional email.                                                               |
| `SITE_PUBLIC_URL`              | Public storefront origin used for customer reset links.                                                     |
| `ADMIN_PUBLIC_URL`             | Public admin origin used for admin reset links.                                                             |
| `CONTACT_TO_EMAIL`             | Internal recipient for `/store/contact` submissions.                                                        |
| `EMAIL_ENABLED`                | Enables real SMTP sends when set to `true`; disabled or incomplete config skips sending safely.             |
| `SEED_IMAGE_BASE_URL`          | Base URL for optional seed product images.                                                                  |

Storefront env file: `apps/storefront/.env`

| Variable                                      | Purpose                                                                                                                                                                                  |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL`              | Public Medusa backend URL used by browser and Next server rendering.                                                                                                                     |
| `MEDUSA_BACKEND_URL`                          | Optional server-only backend URL used by the Next server and middleware. Keep it aligned with the public backend origin unless you intentionally need internal server-to-server routing. |
| `NEXT_PUBLIC_BASE_URL`                        | Public storefront URL used for metadata and absolute URLs.                                                                                                                               |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`          | Medusa publishable API key.                                                                                                                                                              |
| `NEXT_PUBLIC_DEFAULT_REGION`                  | Default storefront region code.                                                                                                                                                          |
| `NEXT_PUBLIC_STRIPE_KEY`                      | Optional Stripe publishable key.                                                                                                                                                         |
| `NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY` | Optional Medusa Payments/Stripe publishable key alias.                                                                                                                                   |
| `NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID`      | Optional connected Stripe account ID.                                                                                                                                                    |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID`                | PayPal browser client ID for checkout buttons.                                                                                                                                           |
| `NEXT_PUBLIC_VERCEL_URL`                      | Optional sitemap site URL for Vercel deployments.                                                                                                                                        |
| `MEDUSA_CLOUD_S3_HOSTNAME`                    | Optional remote image hostname.                                                                                                                                                          |
| `MEDUSA_CLOUD_S3_PATHNAME`                    | Optional remote image pathname.                                                                                                                                                          |

`NODE_ENV` is intentionally owned by Dockerfiles and compose service `environment` blocks, not app `.env` files. Production compose sets `NODE_ENV=production`; the dev override sets `NODE_ENV=development`.

Tooling envs:

| Variable                   | Purpose                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `TEST_TYPE`                | Set by backend package test scripts to select Jest config.                                             |
| `TS_NODE_COMPILER_OPTIONS` | Set by `scripts/run-fix-image-urls.js`; do not put it in app env files.                                |
| `NEXT_DIST_DIR`            | Optional one-off storefront build output directory for validation while a dev server is using `.next`. |

## Docker Usage

Docker services talk to each other through internal service names:

- `postgres` for Postgres
- `redis` for Redis
- `medusa` for the backend container

Browser-facing values must use public URLs in the app env files. Do not use `medusa`, `postgres`, or `redis` as a browser-facing host.

The production Dockerfiles build the backend and storefront during image creation. Compose passes `apps/backend/.env` and `apps/storefront/.env` as BuildKit build secrets so public build-time values are available without copying env files into the image.

After editing the two app env files:

```sh
docker compose down
docker compose up -d --build
```

The default compose stack is production-oriented: the backend image runs `pnpm --filter @dtc/backend build` at build time and the container runs `pnpm start` from `/server/apps/backend`; the storefront image runs `pnpm --filter @dtc/storefront build` at build time and the container runs `pnpm start` from `/server/apps/storefront`. Only ports `9000` and `8000` are published. It does not publish the Vite HMR port.

Storefront build does not require live Medusa backend. Catalog pages are rendered dynamically or use fallback static params, so Docker image creation does not depend on the runtime `medusa` service being reachable.

## Dev vs Production

Production uses built images and stable restart behavior:

```sh
docker compose up -d --build
```

Development uses the same service names, env files, public domains, CORS values, auth secrets, cookie settings, and reverse-proxy assumptions. The override only switches the backend/storefront commands to live-reload mode, builds the dependency stage, adds source bind mounts, and enables file watching:

```sh
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --profile dev up
```

Rebuild when package files, lockfiles, Dockerfiles, or dependencies change. Restart is enough after env changes. In dev, normal source changes should reload through the bind mounts without a full image rebuild.

Keep `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `JWT_SECRET`, `COOKIE_SECRET`, `MEDUSA_BACKEND_URL`, `MEDUSA_ADMIN_BACKEND_URL`, `PUBLIC_BACKEND_URL`, and browser-facing `NEXT_PUBLIC_*` / `VITE_PUBLIC_*` values identical between dev and production. Do not put `localhost`, loopback IPs, private LAN IPs, or Docker service names in browser-facing env vars.

## Admin Keeps Refreshing / Login Loop

If Medusa Admin loops through `/app/login`, `/cloud/auth`, `/app/?token=...`, `/app`, and back to `/app/login`, the browser is not storing or resending the `connect.sid` session cookie. Behind an HTTPS reverse proxy, the backend must issue a cookie with `Secure=true` and `SameSite=None`, and Express must see the original request as HTTPS through forwarded headers.

Backend env for this deployment must use the public HTTPS origins:

```env
PUBLIC_BACKEND_URL=https://ridersadmin.nchehab.ddns.net
PUBLIC_ASSET_BASE_URL=https://ridersadmin.nchehab.ddns.net
MEDUSA_BACKEND_URL=https://ridersadmin.nchehab.ddns.net
MEDUSA_ADMIN_BACKEND_URL=https://ridersadmin.nchehab.ddns.net
STORE_CORS=https://ridersparadise.nchehab.ddns.net,https://ridersadmin.nchehab.ddns.net
ADMIN_CORS=https://ridersadmin.nchehab.ddns.net
AUTH_CORS=https://ridersadmin.nchehab.ddns.net,https://ridersparadise.nchehab.ddns.net
SITE_PUBLIC_URL=https://ridersparadise.nchehab.ddns.net
ADMIN_PUBLIC_URL=https://ridersadmin.nchehab.ddns.net
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
TRUST_PROXY=1
```

The reverse proxy must forward the external HTTPS context:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port 443;
```

Medusa v2.14 reads session cookie settings from `projectConfig.cookieOptions`. This project keeps `sameSite` and `secure` env-driven and defaults `TRUST_PROXY` to `1` for the HTTPS proxy in front of Docker.

Checklist:

1. Use only `https://ridersadmin.nchehab.ddns.net/app` for admin access.
2. In DevTools -> Application -> Cookies, confirm `connect.sid` exists for `ridersadmin.nchehab.ddns.net`.
3. `connect.sid` must have `Secure` and `SameSite=None`.
4. In Network, `GET /admin/users/me` must return `200` after login.
5. The `/admin/users/me` request must include `Cookie: connect.sid`.
6. The reverse proxy must pass `Host`, `X-Forwarded-Proto=https`, `X-Forwarded-Host`, and `X-Forwarded-Port=443`.
7. Check the dev container env without printing secrets:

```sh
docker exec -it medusa_backend_dev sh -lc 'printenv | grep -E "CORS|BACKEND_URL|PUBLIC|COOKIE|TRUST|NODE_ENV|PORT" | sort'
```

8. Set `ADMIN_SESSION_COOKIE_DEBUG=true`, restart Medusa, and inspect sanitized logs for forwarded headers, `has_connect_sid`, `set_cookie_has_secure`, and `set_cookie_has_samesite_none`.

Dev validation:

```sh
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --profile dev down
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --profile dev build --no-cache medusa
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --profile dev up medusa
docker logs -f medusa_backend_dev | grep -Ei "admin-session-cookie-debug|set-cookie|admin/users/me|cloud/auth|cors|cookie|forwarded"
```

Expected: `x_forwarded_proto=https`, `Set-Cookie` includes `Secure` and `SameSite=None`, `has_connect_sid` becomes `true` after login, `/admin/users/me` returns `200`, and the admin stops reloading.

## Storefront Docker Isolation

The storefront container must run from the app package, not from the monorepo root:

```sh
docker compose build --no-cache storefront
docker compose up -d storefront
docker exec -it medusa_storefront sh -lc 'pwd && node -p "require(\"./package.json\").name"'
```

Expected output:

```text
/server/apps/storefront
@dtc/storefront
```

Check that the storefront logs do not contain root Turbo or Medusa commands:

```sh
docker logs medusa_storefront | grep -Ei "medusa build|medusa start|turbo build|turbo start"
```

Expected: no output.

## Production Validation

Rebuild and start the production stack:

```sh
docker compose build --no-cache
docker compose up -d
```

Verify the app containers:

```sh
docker logs medusa_backend
docker logs medusa_storefront
```

Expected checks:

- Backend logs show `medusa start` without TypeScript errors.
- Storefront logs show `next start` without `medusa build`, `medusa start`, `turbo build`, or `turbo start`.
- The default production compose file does not expose Vite HMR port `5173`.

For local development with Vite HMR, start the development profile explicitly:

```sh
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --profile dev up
```

For production, use the default compose file:

```sh
docker compose up --build -d
```

Rebuild images after changing Dockerfiles, package manifests, lockfiles, `NEXT_PUBLIC_*`, `VITE_PUBLIC_*`, `PUBLIC_BACKEND_URL`, `MEDUSA_BACKEND_URL`, or `MEDUSA_ADMIN_BACKEND_URL`. A container restart is enough after changing runtime-only backend values such as database, Redis, CORS, SMTP, secrets, or payment provider settings. Clear the browser cache and sign out/in to the admin after changing admin public URLs, admin backend URLs, CORS/auth origins, or HMR host/port/protocol settings.

To enable PayPal sandbox checkout with Docker, set these in `apps/backend/.env`:

```env
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_WEBHOOK_ID=xxx
PAYPAL_API_BASE_URL=<paypal-api-origin>
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_AUTO_CAPTURE=false
```

And this in `apps/storefront/.env`:

```env
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxx
```

After Docker starts, open Medusa Admin at `{PUBLIC_BACKEND_URL}/app` and enable PayPal for each checkout region:

Settings -> Regions -> Edit Region -> Payment Providers -> PayPal -> Save

For PayPal webhooks, expose the backend with a public URL such as ngrok and configure this webhook URL in the PayPal Developer Dashboard:

```text
{PUBLIC_BACKEND_URL}/hooks/payment/paypal_paypal
```

## Email / Gmail SMTP Setup

Email is wired through Medusa's official Notification Module. The project registers a Gmail SMTP provider for the `email` channel when `EMAIL_PROVIDER=gmail`, and the password reset subscriber listens for Medusa's `auth.password_reset` event for both admin users and customers.

1. Enable 2FA on the Google account that will send transactional email.
2. Create a Google App Password for SMTP.
3. Put the app password in `SMTP_PASS` in `apps/backend/.env`.
4. Set `SMTP_USER` to the Gmail address.
5. Set `SMTP_FROM` to the sender identity, for example `Riders Paradise <no-reply@your-domain.com>`.
6. Set `SITE_PUBLIC_URL` and `ADMIN_PUBLIC_URL` to the public HTTPS storefront and admin origins.
7. Set `CONTACT_TO_EMAIL` to the private inbox that should receive `/store/contact` messages.
8. Rebuild and restart Docker:

```sh
docker compose down
docker compose build --no-cache
docker compose up -d
```

Test a raw SMTP send from the backend package:

```sh
corepack pnpm --filter @dtc/backend email:test
```

You can override the recipient with `EMAIL_TEST_TO=person@example.com`. The command uses `EMAIL_TEST_TO` first, then falls back to `SMTP_USER`.

Then test the product flows:

1. Admin password reset from `${ADMIN_PUBLIC_URL}/app`.
2. Customer password reset from the storefront.
3. Contact form POST to `/store/contact`.

Admin reset links are built as `${ADMIN_PUBLIC_URL}/app/reset-password?token=<token>`. Customer reset links are built as `${SITE_PUBLIC_URL}/account/reset-password?token=<token>`. In production those env values must be public HTTPS origins, not local or LAN hosts.

## Production Admin URL / CORS / Reverse Proxy

Use public browser origins in both dev and production:

```env
PUBLIC_BACKEND_URL=https://ridersadmin.nchehab.ddns.net
PUBLIC_ASSET_BASE_URL=https://ridersadmin.nchehab.ddns.net
MEDUSA_BACKEND_URL=https://ridersadmin.nchehab.ddns.net
MEDUSA_ADMIN_BACKEND_URL=https://ridersadmin.nchehab.ddns.net
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://ridersadmin.nchehab.ddns.net
NEXT_PUBLIC_ASSET_BASE_URL=https://ridersadmin.nchehab.ddns.net
NEXT_PUBLIC_BASE_URL=https://ridersparadise.nchehab.ddns.net
INTERNAL_MEDUSA_URL=http://medusa:9000
STORE_CORS=https://ridersparadise.nchehab.ddns.net,https://ridersadmin.nchehab.ddns.net
ADMIN_CORS=https://ridersadmin.nchehab.ddns.net
AUTH_CORS=https://ridersadmin.nchehab.ddns.net,https://ridersparadise.nchehab.ddns.net
SITE_PUBLIC_URL=https://ridersparadise.nchehab.ddns.net
ADMIN_PUBLIC_URL=https://ridersadmin.nchehab.ddns.net
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
TRUST_PROXY=1
VITE_PUBLIC_HOST=ridersadmin.nchehab.ddns.net
VITE_PUBLIC_ADMIN_BASE_URL=https://ridersadmin.nchehab.ddns.net
VITE_PUBLIC_BACKEND_URL=https://ridersadmin.nchehab.ddns.net
VITE_PUBLIC_ASSET_BASE_URL=https://ridersadmin.nchehab.ddns.net
VITE_HMR_PROTOCOL=wss
VITE_HMR_HOST=ridersadmin.nchehab.ddns.net
VITE_HMR_CLIENT_PORT=443
VITE_DEV_PORT=5173
```

`MEDUSA_ADMIN_BACKEND_URL` is compiled into the Medusa admin build. It must be the public backend/admin origin, not a LAN IP, `localhost`, the Vite HMR origin, or a Docker service name. The reverse proxy should route public backend/admin traffic to the Medusa backend on port `9000`; it should not expose random Vite HMR ports.

For proxied admin development, route browser traffic through HTTPS on port `443` and proxy websocket upgrades to the stable Vite dev port `5173`. The browser should connect to `wss://<public-admin-hostname>/...` on port `443`, not to `:<random-port>`.

Production rebuild and restart:

```sh
docker compose down
docker builder prune -f
docker compose build --no-cache
docker compose up -d
```

If any `NEXT_PUBLIC_*`, `VITE_PUBLIC_*`, or admin backend URL changes, clear stale frontend/admin assets before rebuilding:

```sh
docker compose down
docker builder prune -f
docker compose build --no-cache
docker compose up -d
```

To check for accidental local, private, or internal URL leaks outside generated output:

```sh
npm run check-no-localhost
npm run check:public-urls
```

## Known Pitfalls

- `localhost` means different things in the browser and inside containers. Inside Docker, use service names for internal connections. In browser-facing env vars, use the host users actually visit.
- Medusa's local file provider defaults `backend_url` to `http://localhost:9000/static` when it is not configured. This project throws at startup if `PUBLIC_BACKEND_URL` is missing so uploaded image URLs do not get saved with the wrong origin.
- Next.js `NEXT_PUBLIC_*` variables are bundled for the browser. Only put browser-safe values there.
- If image URLs were already saved with a local origin, run the image URL fix script after setting `PUBLIC_BACKEND_URL`.
- `npm run fix-image-urls` loads `apps/backend/.env`, then patches DB image rows using `DATABASE_URL` and `PUBLIC_BACKEND_URL`.
- Storefront and admin API responses normalize local `/static` and private/internal asset URLs to the configured public asset base URL.
- Vite HMR for the Medusa admin must use `VITE_HMR_PROTOCOL=wss`, `VITE_HMR_HOST=<public-admin-hostname>`, and `VITE_HMR_CLIENT_PORT=443` behind a reverse proxy.

## Commands

```sh
npm run build
npm run docker:up
npm run docker:dev
npm run docker:down
npm run check-env
npm run fix-image-urls
npm run check-no-localhost
npm run check:public-urls
```

Direct SQL patch:

```sh
psql "$DATABASE_URL" -v public_backend_url="$PUBLIC_BACKEND_URL" -f scripts/fix-image-urls.sql
```
