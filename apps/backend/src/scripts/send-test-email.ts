import { loadEnv } from "@medusajs/framework/utils"

import { sendEmail } from "../services/email/email-service"
import { emailTemplates } from "../services/email/templates"

loadEnv(process.env.NODE_ENV || "production", process.cwd())

async function main() {
  const to = process.env.EMAIL_TEST_TO || process.env.SMTP_USER

  if (!to) {
    throw new Error("Set EMAIL_TEST_TO or SMTP_USER before sending a test email")
  }

  const testEmail = emailTemplates.testEmail()
  const result = await sendEmail({
    to,
    ...testEmail,
  })

  if (result.skipped) {
    throw new Error(result.reason)
  }

  console.log(`Sent test email to ${to}: ${result.messageId}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
