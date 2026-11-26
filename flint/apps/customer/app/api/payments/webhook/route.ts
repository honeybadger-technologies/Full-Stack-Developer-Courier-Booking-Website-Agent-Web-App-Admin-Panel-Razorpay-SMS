import { createHmac, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/api-auth'

function signaturesMatch(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)
  if (providedBuffer.length !== expectedBuffer.length) {
    return false
  }
  return timingSafeEqual(providedBuffer, expectedBuffer)
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ''
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Razorpay webhook secret is not configured' }, { status: 503 })
  }

  const signature = request.headers.get('x-razorpay-signature') || ''
  const rawBody = await request.text()
  const expectedSignature = createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
  if (!signature || !signaturesMatch(signature, expectedSignature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  const payload = JSON.parse(rawBody)
  const event = payload?.event
  const orderId = payload?.payload?.payment?.entity?.order_id
  const amount = payload?.payload?.payment?.entity?.amount
  const paymentId = payload?.payload?.payment?.entity?.id

  if (event !== 'payment.captured') {
    return NextResponse.json({ received: true })
  }

  const db = getSupabaseAdmin() ?? (await import('@cbp/supabase')).supabase
  const { data: payment } = await db
    .from('payments')
    .select('*')
    .eq('razorpay_order_id', orderId)
    .single()
  if (!payment) {
    return NextResponse.json({ received: true })
  }

  const { data: order } = await db.from('orders').select('*').eq('id', payment.order_id).single()
  const capturedAmount = Number(amount) || 0
  const orderTotalPaise = Math.round((Number(order?.total_amount) || 0) * 100)
  if (capturedAmount !== orderTotalPaise) {
    return NextResponse.json({ received: true })
  }

  if (payment.status !== 'completed') {
    const { error: updateError } = await db
      .from('payments')
      .update({ status: 'completed', razorpay_payment_id: paymentId })
      .eq('id', payment.id)
      .select()
      .single()
    if (updateError) {
      return NextResponse.json({ error: 'failed to reconcile payment' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}