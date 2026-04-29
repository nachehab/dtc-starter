# Storefront

## Environment modes

Use `.env.development.template` for Docker development and `.env.production.template` for Docker production. Copy the chosen template to `.env`, then fill in the publishable key and any payment provider keys.

`NEXT_PUBLIC_MEDUSA_BACKEND_URL` must be browser-reachable. `MEDUSA_BACKEND_URL` is server-only and may use the Docker backend service name for server rendering and middleware.

## Docker production builds

Docker production builds currently ignore ESLint and TypeScript validation errors during `next build` so lint/type cleanup does not block deployment.

Code cleanup should still be handled separately with focused fixes and normal local checks.
