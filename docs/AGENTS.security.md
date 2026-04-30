# Security AGENTS.md - Compliance, Secrets, and Safe Diagnostics

Scope: repository-wide security posture, secrets handling, env hygiene, logging, auth/cookie safety, payment/email credential protection, and safe operational diagnostics.

## Secret Handling Rules

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

## Env File Rules

- Real env files must remain local and uncommitted.
- Templates may be committed with placeholders only.
- Backend-only env belongs in `apps/backend/.env`.
- Storefront browser env belongs in `apps/storefront/.env`.
- Do not copy a union `.env.example` wholesale into both apps.
- Do not duplicate env keys inside a file.
- Do not put secrets in `NEXT_PUBLIC_*` variables.

## Browser Exposure Rules

Everything prefixed with `NEXT_PUBLIC_*` is public.

Forbidden in public variables:

- Database URLs
- Redis URLs
- SMTP credentials
- PayPal backend secrets
- JWT/cookie secrets
- Admin/private API credentials
- Docker service names for browser use
- Loopback, LAN-only, or non-HTTPS origins for deployed browser use

## Auth and Cookie Rules

- Preserve secure cookie configuration behind HTTPS reverse proxy:

```ts
sameSite: "none"
secure: true
```

- Never rotate `JWT_SECRET` or `COOKIE_SECRET` casually.
- Do not weaken cookie settings to fix login loops.
- Do not log full cookies, session objects, JWTs, authorization headers, reset tokens, or user password-related payloads.

## Validation Commands

```sh
npm run check-env
npm run check-no-localhost
npm run check:public-urls
docker compose config
```
