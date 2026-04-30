import {
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http";

type Logger = {
  info: (message: string) => void;
};

type SetCookieSummary = {
  present: boolean;
  hasSecure: boolean;
  hasSameSiteNone: boolean;
  hasConnectSidSetCookie: boolean;
};

const CONNECT_SID_COOKIE = "connect.sid";

const getLogger = (req: MedusaRequest): Logger => {
  try {
    return req.scope.resolve("logger");
  } catch {
    return console;
  }
};

const sanitizeUrlHeader = (value: string | undefined) => {
  if (!value) {
    return "-";
  }

  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return value.split("?")[0] || "-";
  }
};

const getHeader = (req: MedusaRequest, key: string) =>
  sanitizeUrlHeader(req.get(key));

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

const summarizeSetCookies = (
  setCookieHeader: number | string | string[] | undefined,
): SetCookieSummary => {
  if (!setCookieHeader) {
    return {
      present: false,
      hasSecure: false,
      hasSameSiteNone: false,
      hasConnectSidSetCookie: false,
    };
  }

  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [String(setCookieHeader)];

  return cookies.reduce<SetCookieSummary>(
    (summary, cookie) => {
      const [nameValue, ...rawAttributes] = cookie
        .split(";")
        .map((entry) => entry.trim());
      const attributes = rawAttributes.map((attribute) =>
        attribute.toLowerCase(),
      );

      return {
        present: true,
        hasSecure: summary.hasSecure || attributes.includes("secure"),
        hasSameSiteNone:
          summary.hasSameSiteNone ||
          attributes.some((attribute) => attribute === "samesite=none"),
        hasConnectSidSetCookie:
          summary.hasConnectSidSetCookie ||
          nameValue.split("=")[0] === CONNECT_SID_COOKIE,
      };
    },
    {
      present: false,
      hasSecure: false,
      hasSameSiteNone: false,
      hasConnectSidSetCookie: false,
    },
  );
};

export const adminSessionCookieDebug = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  const logger = getLogger(req);
  const cookieNames = getCookieNames(req.headers.cookie);
  const hasConnectSid = cookieNames.includes(CONNECT_SID_COOKIE);
  const trustProxy = req.app.get("trust proxy");

  logger.info(
    [
      "[admin-session-cookie-debug]",
      `method=${req.method}`,
      `path=${req.path}`,
      "status=pending",
      `host=${getHeader(req, "host")}`,
      `origin=${getHeader(req, "origin")}`,
      `referer=${getHeader(req, "referer")}`,
      `x_forwarded_proto=${getHeader(req, "x-forwarded-proto")}`,
      `x_forwarded_host=${getHeader(req, "x-forwarded-host")}`,
      `x_forwarded_port=${getHeader(req, "x-forwarded-port")}`,
      `trust_proxy=${trustProxy ?? "-"}`,
      `request_secure=${req.secure}`,
      `request_protocol=${req.protocol}`,
      `has_connect_sid=${hasConnectSid}`,
    ].join(" "),
  );

  res.on("finish", () => {
    const setCookie = summarizeSetCookies(res.getHeader("set-cookie"));

    logger.info(
      [
        "[admin-session-cookie-debug]",
        `method=${req.method}`,
        `path=${req.path}`,
        `status=${res.statusCode}`,
        `set_cookie_present=${setCookie.present}`,
        `connect_sid_set_cookie=${setCookie.hasConnectSidSetCookie}`,
        `set_cookie_has_secure=${setCookie.hasSecure}`,
        `set_cookie_has_samesite_none=${setCookie.hasSameSiteNone}`,
      ].join(" "),
    );
  });

  next();
};
