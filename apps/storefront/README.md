# Storefront

Use `.env.production.template` as the storefront env template when building storefront assets. `NEXT_PUBLIC_MEDUSA_BACKEND_URL` must be browser-reachable. `MEDUSA_BACKEND_URL` is server-only and should stay aligned with the public backend origin unless a production server-to-server route is intentionally configured.

The root `docker-compose.yaml` is production-only for the Medusa backend/admin service.
