// Email sending via Resend (https://resend.com)
// Set RESEND_API_KEY and EMAIL_FROM in .env.local to enable.
// Without those env vars, emails are logged to console in development.

interface EmailOptions {
  to: string
  subject: string
  html: string
}

async function sendEmail({ to, subject, html }: EmailOptions) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? "WebOS <noreply@webos.app>"

  if (!apiKey) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`)
    console.log(`[EMAIL] Body preview: ${html.slice(0, 200)}...`)
    return
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error("[EMAIL] Resend error:", error)
    throw new Error("Failed to send email")
  }
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string
  name: string
  resetUrl: string
}) {
  await sendEmail({
    to,
    subject: "Reset your WebOS password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#18181b;margin-bottom:8px">Reset your password</h2>
        <p style="color:#52525b">Hi ${name},</p>
        <p style="color:#52525b">We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:16px 0">
          Reset password
        </a>
        <p style="color:#a1a1aa;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0" />
        <p style="color:#a1a1aa;font-size:12px">WebOS — Universal Website Management Platform</p>
      </div>
    `,
  })
}

export async function sendInvitationEmail({
  to,
  invitedBy,
  workspaceName,
  acceptUrl,
}: {
  to: string
  invitedBy: string
  workspaceName: string
  acceptUrl: string
}) {
  await sendEmail({
    to,
    subject: `You've been invited to join ${workspaceName} on WebOS`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#18181b;margin-bottom:8px">You're invited!</h2>
        <p style="color:#52525b"><strong>${invitedBy}</strong> has invited you to join <strong>${workspaceName}</strong> on WebOS.</p>
        <a href="${acceptUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin:16px 0">
          Accept invitation
        </a>
        <p style="color:#a1a1aa;font-size:13px">This invitation expires in 7 days. If you don't have a WebOS account, you'll be asked to create one.</p>
        <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0" />
        <p style="color:#a1a1aa;font-size:12px">WebOS — Universal Website Management Platform</p>
      </div>
    `,
  })
}

export async function sendOrderNotificationEmail({
  to,
  orderNumber,
  total,
  items,
}: {
  to: string
  orderNumber: string
  total: number
  items: Array<{ name: string; quantity: number; price: number }>
}) {
  const itemRows = items
    .map(i => `<tr><td style="padding:6px 0;color:#52525b">${i.name} × ${i.quantity}</td><td style="text-align:right;color:#52525b">$${(i.price * i.quantity).toFixed(2)}</td></tr>`)
    .join("")

  await sendEmail({
    to,
    subject: `Order ${orderNumber} confirmed`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#18181b;margin-bottom:8px">Order confirmed</h2>
        <p style="color:#52525b">Thank you for your order! Here's a summary:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          ${itemRows}
          <tr style="border-top:1px solid #e4e4e7">
            <td style="padding:8px 0;font-weight:600;color:#18181b">Total</td>
            <td style="text-align:right;font-weight:600;color:#18181b">$${total.toFixed(2)}</td>
          </tr>
        </table>
        <p style="color:#a1a1aa;font-size:13px">Order #${orderNumber}</p>
        <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0" />
        <p style="color:#a1a1aa;font-size:12px">WebOS — Universal Website Management Platform</p>
      </div>
    `,
  })
}
