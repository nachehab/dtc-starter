const BRAND_NAME = "Riders Paradise"

export const emailTemplates = {
  passwordReset({
    resetUrl,
    recipientType,
    expiresIn = "15 minutes",
  }: {
    resetUrl: string
    recipientType: "admin" | "customer"
    expiresIn?: string
  }) {
    const audience = recipientType === "admin" ? "admin account" : "account"
    const subject = `Reset your ${BRAND_NAME} password`
    const text = [
      `Reset your ${BRAND_NAME} ${audience} password`,
      "",
      `Use this secure link to reset your password: ${resetUrl}`,
      "",
      `This link expires in ${expiresIn}.`,
      "If you did not request this, ignore this email.",
    ].join("\n")
    const html = baseHtml({
      title: `Reset your ${BRAND_NAME} password`,
      body: [
        `<p>Use the secure link below to reset your ${audience} password.</p>`,
        `<p><a class="button" href="${escapeHtml(resetUrl)}">Reset password</a></p>`,
        `<p class="fallback">If the button does not work, copy and paste this link into your browser:</p>`,
        `<p class="link">${escapeHtml(resetUrl)}</p>`,
        `<p class="muted">This link expires in ${escapeHtml(expiresIn)}.</p>`,
        `<p class="muted">If you did not request this, ignore this email.</p>`,
      ].join(""),
    })

    return { subject, text, html }
  },

  contactMessage({
    name,
    email,
    phone,
    message,
  }: {
    name: string
    email: string
    phone?: string
    message: string
  }) {
    const subject = `${BRAND_NAME} contact form message`
    const text = [
      "New contact form message",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      "",
      message,
    ].join("\n")
    const html = baseHtml({
      title: "New contact form message",
      body: [
        `<p><strong>Name:</strong> ${escapeHtml(name)}</p>`,
        `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
        `<p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>`,
        `<p><strong>Message:</strong></p>`,
        `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
      ].join(""),
    })

    return { subject, text, html }
  },

  contactConfirmation({ name }: { name: string }) {
    const subject = `We received your message - ${BRAND_NAME}`
    const text = [
      `Hi ${name},`,
      "",
      `Thanks for contacting ${BRAND_NAME}. We received your message and will get back to you soon.`,
      "",
      "If you did not request this, ignore this email.",
    ].join("\n")
    const html = baseHtml({
      title: "We received your message",
      body: [
        `<p>Hi ${escapeHtml(name)},</p>`,
        `<p>Thanks for contacting ${BRAND_NAME}. We received your message and will get back to you soon.</p>`,
        `<p class="muted">If you did not request this, ignore this email.</p>`,
      ].join(""),
    })

    return { subject, text, html }
  },

  testEmail() {
    const subject = `${BRAND_NAME} email test`
    const text = [
      `${BRAND_NAME} email test`,
      "",
      "Gmail SMTP is configured and able to send email.",
    ].join("\n")
    const html = baseHtml({
      title: `${BRAND_NAME} email test`,
      body: "<p>Gmail SMTP is configured and able to send email.</p>",
    })

    return { subject, text, html }
  },
}

const baseHtml = ({ title, body }: { title: string; body: string }) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin: 0; padding: 0; background: #f7f7f7; color: #1f2933; font-family: Arial, sans-serif; }
      .container { max-width: 560px; margin: 32px auto; background: #ffffff; border: 1px solid #e5e7eb; padding: 28px; }
      h1 { margin: 0 0 20px; font-size: 22px; line-height: 1.3; color: #111827; }
      p { margin: 0 0 16px; font-size: 15px; line-height: 1.6; }
      .button { display: inline-block; padding: 12px 18px; background: #111827; color: #ffffff !important; text-decoration: none; font-weight: 700; }
      .fallback { margin-top: 22px; }
      .link { word-break: break-all; color: #2563eb; }
      .muted { color: #6b7280; font-size: 13px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${escapeHtml(title)}</h1>
      ${body}
    </div>
  </body>
</html>`

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
