import {
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http";
import { rewritePublicAssetUrls } from "../lib/public-asset-url";
import { adminSessionCookieDebug } from "./middlewares/admin-session-cookie-debug";

const parseBooleanEnv = (value: string | undefined, fallback: boolean) => {
  if (value === undefined || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const parseTrustProxy = (value: string | undefined) => {
  const parsed = Number.parseInt(value || "1", 10);
  return Number.isNaN(parsed) ? 1 : parsed;
};

const adminSessionCookieDebugEnabled = parseBooleanEnv(
  process.env.ADMIN_SESSION_COOKIE_DEBUG,
  false,
);

let trustProxyApplied = false;

const applyTrustProxyFromEnv = (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  if (!trustProxyApplied) {
    req.app.set("trust proxy", parseTrustProxy(process.env.TRUST_PROXY));
    trustProxyApplied = true;
  }

  next();
};

const rewriteAssetResponseUrls = (
  _req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    return originalJson(rewritePublicAssetUrls(body));
  }) as typeof res.json;

  next();
};

const debugRoutes = adminSessionCookieDebugEnabled
  ? [
      {
        matcher: "/app*",
        middlewares: [adminSessionCookieDebug],
      },
      {
        matcher: "/admin*",
        middlewares: [adminSessionCookieDebug],
      },
      {
        matcher: "/auth*",
        middlewares: [adminSessionCookieDebug],
      },
      {
        matcher: "/cloud/auth*",
        middlewares: [adminSessionCookieDebug],
      },
    ]
  : [];

export default defineMiddlewares({
  routes: [
    {
      matcher: "/",
      middlewares: [applyTrustProxyFromEnv],
    },
    ...debugRoutes,
    {
      matcher: "/admin*",
      middlewares: [rewriteAssetResponseUrls],
    },
    {
      matcher: "/store*",
      middlewares: [rewriteAssetResponseUrls],
    },
  ],
});
