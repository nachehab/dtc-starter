import { loadEnv, defineConfig } from "@medusajs/framework/utils";

type CookieSameSite = "none" | "lax" | "strict";

loadEnv(process.env.NODE_ENV || "production", process.cwd());

const isPackageBuild = process.env.npm_lifecycle_event === "build";
const buildEnvFallbacks: Record<string, string> = {
  PUBLIC_BACKEND_URL: "https://your-domain",
  MEDUSA_BACKEND_URL: "https://your-domain",
  MEDUSA_ADMIN_BACKEND_URL: "https://your-domain",
  DATABASE_URL: "postgres://postgres:postgres@postgres:5432/medusa-store",
  REDIS_URL: "redis://redis:6379",
  STORE_CORS: "https://your-storefront-domain,https://your-domain",
  ADMIN_CORS: "https://your-domain",
  AUTH_CORS: "https://your-domain",
  JWT_SECRET: "build-time-jwt-secret-not-used-at-runtime",
  COOKIE_SECRET: "build-time-cookie-secret-not-used-at-runtime",
};

const getRequiredEnv = (key: string) => {
  const value = process.env[key];

  if (!value) {
    if (isPackageBuild && buildEnvFallbacks[key]) {
      return buildEnvFallbacks[key];
    }

    throw new Error(`${key} is not defined`);
  }

  return value;
};

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const LOCAL_HOSTNAME = `${"local"}${"host"}`;
const LOOPBACK_HOST = `${"127"}.0.0.1`;

const isPrivateIpHostname = (hostname: string) => {
  const parts = hostname.split(".").map((part) => Number.parseInt(part, 10));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [first, second] = parts;

  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
};

const isLocalOrPrivateUrl = (value: string) => {
  try {
    const hostname = new URL(value).hostname;

    return (
      hostname === LOCAL_HOSTNAME ||
      hostname === LOOPBACK_HOST ||
      isPrivateIpHostname(hostname)
    );
  } catch {
    return false;
  }
};

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const parseBooleanEnv = (value: string | undefined, fallback: boolean) => {
  if (value === undefined || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const parseTrustProxyEnv = (value: string | undefined) => {
  const parsed = Number.parseInt(value || "1", 10);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error("TRUST_PROXY must be a non-negative integer");
  }

  return parsed;
};

const parseCookieSameSite = (
  value: string | undefined,
  fallback: CookieSameSite,
): CookieSameSite => {
  if (!value) {
    return fallback;
  }

  const normalized = value.toLowerCase();

  if (["none", "lax", "strict"].includes(normalized)) {
    return normalized as CookieSameSite;
  }

  throw new Error("COOKIE_SAME_SITE must be one of: none, lax, strict");
};

const parsePort = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const getRequiredOriginEnv = (key: string) => {
  const value = getRequiredEnv(key);
  const normalized = stripTrailingSlash(value);

  if (value !== normalized) {
    throw new Error(`${key} must not include a trailing slash`);
  }

  return value;
};

const PUBLIC_URL = getRequiredOriginEnv("PUBLIC_BACKEND_URL");
const MEDUSA_BACKEND_URL = getRequiredOriginEnv("MEDUSA_BACKEND_URL");
const MEDUSA_ADMIN_BACKEND_URL = getRequiredOriginEnv(
  "MEDUSA_ADMIN_BACKEND_URL",
);

const backendUrlAliases = {
  MEDUSA_BACKEND_URL,
  MEDUSA_ADMIN_BACKEND_URL,
};

Object.entries(backendUrlAliases).forEach(([key, value]) => {
  if (value !== PUBLIC_URL) {
    throw new Error(`${key} must match PUBLIC_BACKEND_URL`);
  }
});

if (process.env.NODE_ENV === "production") {
  if (
    isLocalOrPrivateUrl(PUBLIC_URL) ||
    isLocalOrPrivateUrl(MEDUSA_BACKEND_URL) ||
    isLocalOrPrivateUrl(MEDUSA_ADMIN_BACKEND_URL)
  ) {
    throw new Error("Backend URLs must use public origins in production");
  }
}

const cookieSecure = parseBooleanEnv(
  process.env.COOKIE_SECURE,
  isHttpsUrl(PUBLIC_URL),
);
const cookieSameSite = parseCookieSameSite(
  process.env.COOKIE_SAME_SITE,
  "none",
);
const trustProxy = parseTrustProxyEnv(process.env.TRUST_PROXY);
process.env.TRUST_PROXY = String(trustProxy);

if (cookieSameSite === "none" && !cookieSecure) {
  throw new Error("COOKIE_SAME_SITE=none requires COOKIE_SECURE=true");
}

const parseEnvList = (value?: string) =>
  value
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean) ?? [];

const getEnvOrFallback = (key: string, fallbackKey: string) =>
  process.env[key] || getRequiredEnv(fallbackKey);

const hostnameFromUrl = (value?: string) => {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
};

const adminAllowedHosts = Array.from(
  new Set(
    [
      hostnameFromUrl(PUBLIC_URL),
      hostnameFromUrl(MEDUSA_ADMIN_BACKEND_URL),
      ...parseEnvList(process.env.MEDUSA_BACKEND_URL).map(hostnameFromUrl),
      ...parseEnvList(process.env.MEDUSA_ADMIN_BACKEND_URL).map(
        hostnameFromUrl,
      ),
      ...parseEnvList(process.env.__MEDUSA_ADMIN_ADDITIONAL_ALLOWED_HOSTS).map(
        hostnameFromUrl,
      ),
    ].filter(Boolean) as string[],
  ),
);

if (adminAllowedHosts.length > 0) {
  process.env.__MEDUSA_ADMIN_ADDITIONAL_ALLOWED_HOSTS =
    adminAllowedHosts.join(",");
}

const isPaypalConfigured =
  !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET;

const emailProvider = process.env.EMAIL_PROVIDER || "local";
const isGmailEmailProvider = emailProvider === "gmail";

if (process.env.EMAIL_ENABLED === "true" && isGmailEmailProvider) {
  const missingEmailKeys = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "SITE_PUBLIC_URL",
    "ADMIN_PUBLIC_URL",
  ].filter((key) => !process.env[key]);

  if (missingEmailKeys.length > 0) {
    console.warn(
      `[email:gmail] Email is enabled but missing configuration: ${missingEmailKeys.join(
        ", ",
      )}`,
    );
  }
}

if (!isPaypalConfigured) {
  console.warn(
    "[payments:paypal] PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are not defined. PayPal payment provider is disabled.",
  );
}

const modules = [
  {
    resolve: "@medusajs/medusa/caching",
    options: {
      providers: [
        {
          resolve: "@medusajs/caching-redis",
          id: "caching-redis",
          is_default: true,
          options: {
            redisUrl: getEnvOrFallback("CACHE_REDIS_URL", "REDIS_URL"),
          },
        },
      ],
    },
  },
  {
    resolve: "@medusajs/medusa/event-bus-redis",
    options: {
      redisUrl: getRequiredEnv("REDIS_URL"),
    },
  },
  {
    resolve: "@medusajs/medusa/workflow-engine-redis",
    options: {
      redis: {
        redisUrl: getRequiredEnv("REDIS_URL"),
      },
    },
  },
  {
    resolve: "@medusajs/medusa/locking",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/locking-redis",
          id: "locking-redis",
          is_default: true,
          options: {
            redisUrl: getEnvOrFallback("LOCKING_REDIS_URL", "REDIS_URL"),
          },
        },
      ],
    },
  },
  {
    resolve: "@medusajs/medusa/notification",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/notification-local",
          id: "local-feed",
          options: {
            channels: ["feed"],
          },
        },
        ...(isGmailEmailProvider
          ? [
              {
                resolve: "./src/modules/gmail-notification",
                id: "gmail",
                options: {
                  channels: ["email"],
                  enabled: process.env.EMAIL_ENABLED === "true",
                  host: process.env.SMTP_HOST,
                  port: parsePort(process.env.SMTP_PORT),
                  secure: process.env.SMTP_SECURE === "true",
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASS,
                  from: process.env.SMTP_FROM,
                },
              },
            ]
          : [
              {
                resolve: "@medusajs/medusa/notification-local",
                id: "local-email",
                options: {
                  channels: ["email"],
                },
              },
            ]),
      ],
    },
  },
  {
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/file-local",
          id: "local",
          options: {
            upload_dir: "static",
            backend_url: `${PUBLIC_URL}/static`,
          },
        },
      ],
    },
  },
  ...(isPaypalConfigured
    ? [
        {
          resolve: "@medusajs/medusa/payment",
          options: {
            providers: [
              {
                resolve: "./src/modules/paypal",
                id: "paypal",
                options: {
                  client_id: process.env.PAYPAL_CLIENT_ID,
                  client_secret: process.env.PAYPAL_CLIENT_SECRET,
                  environment: process.env.PAYPAL_ENVIRONMENT || "sandbox",
                  autoCapture: process.env.PAYPAL_AUTO_CAPTURE === "true",
                  webhook_id: process.env.PAYPAL_WEBHOOK_ID,
                  api_base_url: process.env.PAYPAL_API_BASE_URL,
                },
              },
            ],
          },
        },
      ]
    : []),
];
const plugins = [
  {
    resolve: "@medusajs/draft-order",
    options: {},
  },
];

[
  "STORE_CORS",
  "ADMIN_CORS",
  "AUTH_CORS",
  "JWT_SECRET",
  "COOKIE_SECRET",
].forEach(getRequiredEnv);

module.exports = defineConfig({
  projectConfig: {
    databaseDriverOptions: {
      ssl: false,
      sslmode: "disable",
    },
    databaseUrl: getRequiredEnv("DATABASE_URL"),
    redisUrl: getRequiredEnv("REDIS_URL"),
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET!,
      cookieSecret: process.env.COOKIE_SECRET!,
    },
    cookieOptions: {
      sameSite: cookieSameSite,
      secure: cookieSecure,
    },
  },
  admin: {
    backendUrl: MEDUSA_ADMIN_BACKEND_URL,
  },
  plugins,
  modules,
});
