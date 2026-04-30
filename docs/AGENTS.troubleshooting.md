# Troubleshooting Agent Guide

Use this guide for production operational debugging. Keep diagnostics sanitized: never print secrets, full cookies, tokens, SMTP passwords, PayPal secrets, or database credentials.

## Admin Login Loop

Checklist:

- Confirm backend env uses public HTTPS origins: `PUBLIC_BACKEND_URL`, `MEDUSA_BACKEND_URL`, `MEDUSA_ADMIN_BACKEND_URL`, `STORE_CORS`, `ADMIN_CORS`, and `AUTH_CORS`.
- Confirm `COOKIE_SECRET` and `JWT_SECRET` exist and did not change unexpectedly.
- Confirm Medusa cookie config remains `sameSite: "none"` and `secure: true`.
- Confirm the browser keeps a `connect.sid` cookie with `Secure=true` and `SameSite=None`.
- Confirm reverse proxy forwards:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port 443;
```

Commands:

```sh
docker compose config
docker logs medusa_backend --tail=150
```

Redact secret values before sharing output.

## Public URL Leaks

Symptoms:

- Browser requests a loopback host, a LAN IP, a Docker service name, or an unexpected port.
- Product images point to local origins.

Checklist:

- Confirm `PUBLIC_BACKEND_URL` and `PUBLIC_ASSET_BASE_URL` are public HTTPS backend/admin origins.
- Confirm Medusa local file provider uses `PUBLIC_BACKEND_URL` for `/static`.
- Check existing DB image URLs and run the image URL fix workflow if old origins are present.
- Rebuild the production image after public env changes.

Commands:

```sh
npm run check-no-localhost
npm run check:public-urls
npm run fix-image-urls
```

## Production Validation

```sh
docker compose config
docker compose build --no-cache medusa
docker compose up -d postgres redis medusa
docker compose ps
docker logs medusa_backend --tail=150
docker exec -it medusa_backend sh -lc 'pwd && node -p "process.cwd()" && find .medusa -name index.html -print'
docker inspect medusa_backend --format '{{json .Mounts}}'
```
