import { NextResponse } from 'next/server'
import { createTransport } from 'nodemailer'

export async function POST(request: Request) {
  const body = await request.json()
  const to = typeof body.to === 'string' ? body.to.trim() : ''
  const subject = typeof body.subject === 'string' ? body.subject : ''
  const text = typeof body.body === 'string' ? body.body : ''

  if (!to || !subject || !text) {
    return NextResponse.json({ error: 'to, subject and body are required' }, { status: 400 })
  }

  const from = process.env.SMTP_FROM || process.env.NEXT_PUBLIC_APP_EMAIL || 'noreply@courier.com'
  const transport = createTransport(
    process.env.SMTP_TRANSPORT === 'json'
      ? { jsonTransport: true }
      : {
          host: process.env.SMTP_HOST || 'localhost',
          port: Number(process.env.SMTP_PORT || 587),
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
            : undefined,
        }
  )

  const info = await transport.sendMail({
    from,
    to,
    subject,
    text,
    html: `<p>${text.replace(/\n/g, '<br/>')}</p>`,
  })

  return NextResponse.json({ success: true, messageId: info.messageId })
}