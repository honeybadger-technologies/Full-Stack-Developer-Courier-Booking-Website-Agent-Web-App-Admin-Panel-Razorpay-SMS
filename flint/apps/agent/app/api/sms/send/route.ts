import { NextResponse } from 'next/server'

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || ''

export async function POST(request: Request) {
  const body = await request.json()
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const message = typeof body.message === 'string' ? body.message : ''

  if (!phone || !message) {
    return NextResponse.json({ error: 'phone and message are required' }, { status: 400 })
  }

  if (!MSG91_AUTH_KEY) {
    return NextResponse.json({ error: 'SMS gateway is not configured' }, { status: 503 })
  }

  const res = await fetch('https://api.msg91.com/sms/v3/sendText', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: MSG91_AUTH_KEY },
    body: JSON.stringify({
      senderid: process.env.NEXT_PUBLIC_MSG91_SENDER || 'CNRPAYR',
      mobiles: [{ number: phone }],
      message,
      country: 'IN',
    }),
  })

  const data = await res.json().catch(() => null)
  const success = res.ok && data?.type !== 'error'

  return NextResponse.json({
    success,
    msg91Id: data?.messageId || null,
  })
}