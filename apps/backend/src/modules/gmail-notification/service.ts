import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import { AbstractNotificationProviderService } from "@medusajs/framework/utils"

import {
  getEmailConfigFromOptions,
  sendEmail,
  type EmailConfig,
} from "../../services/email/email-service"
import { emailTemplates } from "../../services/email/templates"

type InjectedDependencies = {
  logger: Logger
}

type GmailNotificationOptions = Partial<EmailConfig> & {
  channels?: string[]
}

class GmailNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-gmail"

  protected readonly logger: Logger
  protected readonly config: EmailConfig

  constructor({ logger }: InjectedDependencies, options: GmailNotificationOptions) {
    super()

    this.logger = logger
    this.config = getEmailConfigFromOptions(options)
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    try {
      const rendered = this.renderNotification(notification)

      if (!rendered) {
        this.logger.warn(
          `[email:gmail] No email template found for ${notification.template}`
        )
        return {}
      }

      const result = await sendEmail(
        {
          to: notification.to,
          subject: notification.content?.subject || rendered.subject,
          html: notification.content?.html || rendered.html,
          text: notification.content?.text || rendered.text,
          replyTo: getString(notification.provider_data?.reply_to),
        },
        this.config
      )

      if (result.skipped) {
        this.logger.warn(`[email:gmail] ${result.reason}`)
        return {}
      }

      return {
        id: result.messageId,
      }
    } catch (error) {
      this.logger.error(
        `[email:gmail] Failed to send email notification: ${formatError(error)}`
      )
      return {}
    }
  }

  protected renderNotification(notification: ProviderSendNotificationDTO) {
    if (notification.template === "password-reset") {
      const resetUrl = getString(notification.data?.reset_url)
      const recipientType =
        notification.data?.recipient_type === "admin" ? "admin" : "customer"

      if (!resetUrl) {
        return null
      }

      return emailTemplates.passwordReset({
        resetUrl,
        recipientType,
        expiresIn: getString(notification.data?.expires_in) || "15 minutes",
      })
    }

    if (notification.content?.subject && notification.content.html && notification.content.text) {
      return {
        subject: notification.content.subject,
        html: notification.content.html,
        text: notification.content.text,
      }
    }

    return null
  }
}

const getString = (value: unknown) => (typeof value === "string" ? value : undefined)
const formatError = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

export default GmailNotificationProviderService
