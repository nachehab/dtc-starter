# Security AGENTS.md — Compliance, Secrets, and Safe Diagnostics

Scope: repository-wide security posture, secrets handling, env hygiene, logging, auth/cookie safety, payment/email credential protection, and safe operational diagnostics.

Read `../AGENTS.md`, `../README.md`, `../apps/backend/AGENTS.md`, and `../apps/storefront/AGENTS.md` before changing code that touches secrets, auth, checkout, email, uploads, proxy behavior, or logs.

## Secret handling rules

Never commit, paste, log, or document real values for:

- `JWT_SECRET`
- `COOKIE_SECRET`
- `SMTP_PASS`
- `SMTP_USER` when tied to a private sender identity in public diagnostics
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- Database passwords
- Redis passwords
- API keys or OAuth tokens
- Session cookies
- Bearer tokens
- Password reset tokens
- Webhook signatures
- Private keys or certificates

Allowed documentation pattern:

```env
JWT_SECRET=<secure-random-value>
COOKIE_SECRET=<secure-random-value>
SMTP_PASS=<gmail-app-password>
PAYPAL_CLIENT_SECRET=<paypal-secret>
```

Safe diagnostic pattern:

```text
JWT_SECRET: present, length >= 32
COOKIE_SECRET: present, unchanged since previous deployment
SMTP_PASS: present, redacted
PAYPAL_CLIENT_SECRET: present, redacted
```

## Env file rules

- Real env files must remain local and uncommitted.
- Templates may be committed with placeholders only.
- Backend-only env belongs in `apps/backend/.env`.
- Storefront browser env belongs in `apps/storefront/.env`.
- Do not copy a union `.env.example` wholesale into both apps.
- Do not duplicate env keys inside a file.
- Do not put secrets in `NEXT_PUBLIC_*` or `VITE_PUBLIC_*` variables.

## Browser exposure rules

Everything prefixed with these is public:

- `NEXT_PUBLIC_*`
- `VITE_PUBLIC_*`

Forbidden in public variables:

- Database URLs
- Redis URLs
- SMTP credentials
- PayPal backend secrets
- JWT/cookie secrets
- Admin/private API credentials
- Docker service names for browser use
- Localhost, loopback, or LAN-only origins for deployed browser use

## Auth and cookie rules

- Preserve secure cookie configuration behind HTTPS reverse proxy:

```ts
sameSite: "none"
secure: true
```

- Never rotate `JWT_SECRET` or `COOKIE_SECRET` casually.
- Do not weaken cookie settings to fix login loops.
- Login loops should be debugged by checking public origins, CORS/auth origins, HTTPS proxy headers, cookie attributes, and stable secrets.
- Do not log full cookies, session objects, JWTs, authorization headers, reset tokens, or user password-related payloads.

## Payment security rules

- Backend PayPal secrets stay in backend env only.
- Storefront may receive only public PayPal client ID values.
- Webhook verification must use backend-only credentials.
- Never log PayPal access tokens, client secrets, webhook signatures, raw authorization headers, or full payment provider payloads containing sensitive fields.
- Checkout UI should show customer-safe errors only.

## Email security rules

- Gmail app passwords stay in backend env only.
- Never log `SMTP_PASS` or full SMTP transport config.
- Password reset links must use public HTTPS origins from env.
- Reset tokens should never be logged in plaintext outside local one-off diagnostics, and diagnostics should prefer presence/shape checks.

## Logging and diagnostics rules

Safe logs may include:

- Non-secret public origins.
- Boolean presence of required secrets.
- Sanitized hostnames.
- HTTP status codes.
- Container names and service health.
- File existence checks for generated build output.

Unsafe logs include:

- Full env dumps without redaction.
- Cookies or headers.
- SMTP credentials.
- Payment credentials.
- Database URLs with passwords.
- Reset tokens or auth tokens.

When asking for logs or posting logs, redact with:

```text
<redacted>
```

## Dependency and supply-chain rules

- Keep dependency changes intentional and reflected in the lockfile.
- Do not add packages only for trivial healthchecks if Node built-ins can do the job.
- Do not pin random unreviewed packages for auth, payment, crypto, or email without checking official docs and package health.
- Do not patch dependencies in `node_modules`; fix source/config or use documented overrides with explanation.

## Validation commands

Run before security-sensitive changes are considered complete:

```sh
npm run check-env
npm run check-no-localhost
npm run check:public-urls
docker compose config
```

Manual redaction check:

```sh
grep -RniE "SMTP_PASS|PAYPAL_CLIENT_SECRET|JWT_SECRET|COOKIE_SECRET|BEGIN PRIVATE KEY|api_key|access_token|refresh_token" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=.medusa
```

If a real secret was committed or posted publicly, rotate it. Do not merely delete it from the latest commit.

## Incident response

If a real credential is exposed:

1. Rotate/revoke the credential at the provider.
2. Replace local `.env` with the new value.
3. Rebuild/restart affected services.
4. Remove the secret from git history if needed.
5. Add or update validation to prevent recurrence.

For already exposed Gmail app passwords, PayPal secrets, JWT secrets, or cookie secrets, assume compromise and rotate.
