import { loadEnv, defineConfig } from "@medusajs/framework/utils"

type CookieSameSite = "none" | "lax" | "strict"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const getRequiredEnv = (key: string) => {
  const value = process.env[key]

  if (!value) {
    throw new Error(`${key} is not defined`)
  }

  return value
}

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "")

const parseBooleanEnv = (value: string | undefined, fallback: boolean) => {
  if (value === undefined || value === "") {
    return fallback
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

const parseCookieSameSite = (
  value: string | undefined,
  fallback: CookieSameSite,
): CookieSameSite => {
  if (!value) {
    return fallback
  }

  const normalized = value.toLowerCase()

  if (["none", "lax", "strict"].includes(normalized)) {
    return normalized as CookieSameSite
  }

  throw new Error("COOKIE_SAME_SITE must be one of: none, lax, strict")
}

const parsePort = (value?: string) => {
  if (!value) {
    return undefined
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

const getEnvOrFallback = (key: string, fallbackKey: string) =>
  process.env[key] || getRequiredEnv(fallbackKey)

const PUBLIC_BACKEND_URL = stripTrailingSlash(
  process.env.PUBLIC_BACKEND_URL || "http://localhost:9000",
)
const MEDUSA_ADMIN_BACKEND_URL = stripTrailingSlash(
  process.env.MEDUSA_ADMIN_BACKEND_URL ||
    process.env.MEDUSA_BACKEND_URL ||
    PUBLIC_BACKEND_URL,
)

const cookieSameSite = parseCookieSameSite(
  process.env.COOKIE_SAME_SITE,
  "lax",
)
const cookieSecure = parseBooleanEnv(process.env.COOKIE_SECURE, false)

const isPaypalConfigured =
  !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET

const emailProvider = process.env.EMAIL_PROVIDER || "local"
const isGmailEmailProvider = emailProvider === "gmail"

if (process.env.EMAIL_ENABLED === "true" && isGmailEmailProvider) {
  const missingEmailKeys = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "SITE_PUBLIC_URL",
    "ADMIN_PUBLIC_URL",
  ].filter((key) => !process.env[key])

  if (missingEmailKeys.length > 0) {
    console.warn(
      `[email:gmail] Email is enabled but missing configuration: ${missingEmailKeys.join(
        ", ",
      )}`,
    )
  }
}

if (!isPaypalConfigured) {
  console.warn(
    "[payments:paypal] PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are not defined. PayPal payment provider is disabled.",
  )
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
            backend_url: `${PUBLIC_BACKEND_URL}/static`,
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
]

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    cookieOptions: {
      sameSite: cookieSameSite,
      secure: cookieSecure,
    },
  },
  admin: {
    backendUrl: MEDUSA_ADMIN_BACKEND_URL,
  },
  modules,
})
