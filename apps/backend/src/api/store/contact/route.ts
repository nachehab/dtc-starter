import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

import { sendEmail } from "../../../services/email/email-service"
import { emailTemplates } from "../../../services/email/templates"

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(5000),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const parsed = contactSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid contact request",
      errors: parsed.error.flatten().fieldErrors,
    })
  }

  const contactTo = process.env.CONTACT_TO_EMAIL

  if (!contactTo) {
    logger.warn("[email:contact] CONTACT_TO_EMAIL is not configured")
    return res.status(503).json({
      message: "Contact email is not configured",
    })
  }

  const { name, email, phone, message } = parsed.data
  const contactEmail = emailTemplates.contactMessage({
    name,
    email,
    phone: phone || undefined,
    message,
  })

  try {
    const result = await sendEmail({
      to: contactTo,
      replyTo: email,
      ...contactEmail,
    })

    if (result.skipped) {
      logger.warn(`[email:contact] ${result.reason}`)
      return res.status(503).json({
        message: "Contact email is not available",
      })
    }

    const confirmationEmail = emailTemplates.contactConfirmation({ name })

    await sendEmail({
      to: email,
      ...confirmationEmail,
    }).catch((error) => {
      logger.warn(
        `[email:contact] Failed to send contact confirmation: ${formatError(error)}`
      )
    })

    // TODO: add IP/user rate limiting middleware if this endpoint receives public traffic.
    return res.status(200).json({
      message: "Message sent",
    })
  } catch (error) {
    logger.error(`[email:contact] Failed to send contact message: ${formatError(error)}`)
    return res.status(500).json({
      message: "Unable to send message",
    })
  }
}

const formatError = (error: unknown) =>
  error instanceof Error ? error.message : String(error)
