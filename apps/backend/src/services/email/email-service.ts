import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer"

export type EmailConfig = {
  enabled: boolean
  host?: string
  port?: number
  secure: boolean
  user?: string
  pass?: string
  from?: string
}

export type SendEmailInput = {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}

let transporter: Transporter | undefined
let transporterKey: string | undefined

export const getEmailConfig = (): EmailConfig => ({
  enabled: process.env.EMAIL_ENABLED === "true",
  host: process.env.SMTP_HOST,
  port: parseOptionalPort(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM,
})

export const getEmailConfigFromOptions = (
  options: Partial<EmailConfig>
): EmailConfig => ({
  enabled: options.enabled === true,
  host: options.host,
  port: options.port,
  secure: options.secure === true,
  user: options.user,
  pass: options.pass,
  from: options.from,
})

export const isEmailConfigured = (config = getEmailConfig()) =>
  Boolean(
    config.enabled &&
      config.host &&
      config.port &&
      config.user &&
      config.pass &&
      config.from
  )

export const maskEmailConfig = (config = getEmailConfig()) => ({
  enabled: config.enabled,
  host: config.host,
  port: config.port,
  secure: config.secure,
  user: config.user,
  pass: config.pass ? "***" : undefined,
  from: config.from,
})

export async function sendEmail(
  { to, subject, html, text, replyTo }: SendEmailInput,
  config = getEmailConfig()
) {
  if (!config.enabled) {
    return { skipped: true, reason: "Email is disabled" }
  }

  if (!isEmailConfigured(config)) {
    return {
      skipped: true,
      reason: "Email SMTP configuration is incomplete",
      config: maskEmailConfig(config),
    }
  }

  const mailOptions: SendMailOptions = {
    from: config.from,
    to,
    subject,
    html,
    text,
    replyTo,
  }

  const info = await getTransporter(config).sendMail(mailOptions)

  return {
    skipped: false,
    messageId: info.messageId,
  }
}

const getTransporter = (config: EmailConfig) => {
  const key = [
    config.host,
    config.port,
    config.secure,
    config.user,
    config.from,
  ].join("|")

  if (!transporter || transporterKey !== key) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    })
    transporterKey = key
  }

  return transporter
}

const parseOptionalPort = (value?: string) => {
  if (!value) {
    return undefined
  }

  const parsed = Number.parseInt(value, 10)

  return Number.isNaN(parsed) ? undefined : parsed
}
