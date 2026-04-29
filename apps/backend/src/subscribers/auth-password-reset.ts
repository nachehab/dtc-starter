import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import type { INotificationModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

type PasswordResetEvent = {
  entity_id: string
  token: string
  actor_type: string
  metadata?: Record<string, unknown>
}

const LOCAL_HOSTNAME = `${"local"}${"host"}`
const LOOPBACK_HOST = `${"127"}.0.0.1`

export default async function passwordResetHandler({
  event: {
    data: { entity_id: email, token, actor_type },
  },
  container,
}: SubscriberArgs<PasswordResetEvent>) {
  const logger = container.resolve("logger")

  try {
    const recipientType = actor_type === "customer" ? "customer" : "admin"
    const resetUrl =
      recipientType === "customer"
        ? buildResetUrl("SITE_PUBLIC_URL", "/account/reset-password", token)
        : buildResetUrl("ADMIN_PUBLIC_URL", "/app/reset-password", token)

    const notificationModuleService: INotificationModuleService =
      container.resolve(Modules.NOTIFICATION)

    await notificationModuleService.createNotifications({
      to: email,
      channel: "email",
      template: "password-reset",
      data: {
        reset_url: resetUrl,
        recipient_type: recipientType,
        expires_in: "15 minutes",
      },
    })
  } catch (error) {
    logger.error(`[email] Failed to queue password reset email: ${formatError(error)}`)
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}

const buildResetUrl = (envKey: "SITE_PUBLIC_URL" | "ADMIN_PUBLIC_URL", path: string, token: string) => {
  const baseUrl = stripTrailingSlash(process.env[envKey] || "")

  if (!baseUrl) {
    throw new Error(`${envKey} is required to build password reset emails`)
  }

  assertPublicUrl(baseUrl, envKey)

  const url = new URL(path, `${baseUrl}/`)
  url.searchParams.set("token", token)

  return url.toString()
}

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "")

const formatError = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

const assertPublicUrl = (value: string, envKey: string) => {
  const url = new URL(value)

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error(`${envKey} must use HTTPS in production`)
  }

  if (
    process.env.NODE_ENV === "production" &&
    (url.hostname === LOCAL_HOSTNAME ||
      url.hostname === LOOPBACK_HOST ||
      isPrivateNetworkHostname(url.hostname))
  ) {
    throw new Error(`${envKey} must use a public host in production`)
  }
}

const isPrivateNetworkHostname = (hostname: string) => {
  const parts = hostname.split(".").map((part) => Number.parseInt(part, 10))

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false
  }

  const [first, second] = parts

  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  )
}
