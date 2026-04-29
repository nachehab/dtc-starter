import {
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http";
import { rewritePublicAssetUrls } from "../lib/public-asset-url";

type Logger = {
  info: (message: string) => void;
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

const getLogger = (req: MedusaRequest): Logger => {
  try {
    return req.scope.resolve("logger");
  } catch {
    return console;
  }
};

const getCookieNames = (cookieHeader: string | string[] | undefined) => {
  const rawCookieHeader = Array.isArray(cookieHeader)
    ? cookieHeader.join(";")
    : cookieHeader;

  return (
    rawCookieHeader
      ?.split(";")
      .map((entry) => entry.trim().split("=")[0])
      .filter(Boolean) ?? []
  );
};

const describeSetCookies = (
  setCookieHeader: number | string | string[] | undefined,
) => {
  if (!setCookieHeader) {
    return [];
  }

  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [String(setCookieHeader)];

  return cookies
    .map((cookie) => {
      const [nameValue, ...rawAttributes] = cookie
        .split(";")
        .map((entry) => entry.trim());
      const name = nameValue.split("=")[0];
      const attributes = rawAttributes.map((attribute) =>
        attribute.toLowerCase(),
      );
      const sameSite =
        rawAttributes.find((attribute) =>
          attribute.toLowerCase().startsWith("samesite="),
        ) ?? "SameSite=unset";
      const domain =
        rawAttributes.find((attribute) =>
          attribute.toLowerCase().startsWith("domain="),
        ) ?? "Domain=host-only";

      return `${name}{Secure=${attributes.includes("secure")},${sameSite},${domain}}`;
    })
    .filter(Boolean);
};

const logAdminSessionCookies = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  const logger = getLogger(req);
  const cookieNames = getCookieNames(req.headers.cookie);
  const hasConnectSid = cookieNames.includes("connect.sid");

  logger.info(
    [
      "[admin-session-cookie-debug]",
      `${req.method} ${req.originalUrl}`,
      `status=pending`,
      `has_connect_sid=${hasConnectSid}`,
      `cookie_names=${cookieNames.join(",") || "-"}`,
      `secure=${req.secure}`,
      `protocol=${req.protocol}`,
      `host=${req.get("host") ?? "-"}`,
      `x_forwarded_proto=${req.get("x-forwarded-proto") ?? "-"}`,
      `x_forwarded_host=${req.get("x-forwarded-host") ?? "-"}`,
      `x_forwarded_port=${req.get("x-forwarded-port") ?? "-"}`,
    ].join(" "),
  );

  res.on("finish", () => {
    const setCookies = describeSetCookies(res.getHeader("set-cookie"));

    logger.info(
      [
        "[admin-session-cookie-debug]",
        `${req.method} ${req.originalUrl}`,
        `status=${res.statusCode}`,
        `set_cookie=${setCookies.join(",") || "-"}`,
      ].join(" "),
    );
  });

  next();
};

export default defineMiddlewares({
  routes: [
    {
      matcher: /^\/admin\/auth(\/.*)?$/,
      middlewares: [logAdminSessionCookies],
    },
    {
      matcher: /^\/auth(\/.*)?$/,
      middlewares: [logAdminSessionCookies],
    },
    {
      matcher: /^\/cloud\/auth(\/.*)?$/,
      middlewares: [logAdminSessionCookies],
    },
    {
      matcher: "/admin/users/me",
      middlewares: [logAdminSessionCookies],
    },
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
