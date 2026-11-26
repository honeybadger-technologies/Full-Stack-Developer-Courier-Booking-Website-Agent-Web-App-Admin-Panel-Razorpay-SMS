import { createHmac, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { getAuthUser, getSupabaseAdmin } from '../../../../lib/api-auth'

const RAZORPAY_BASE_URL = process.env.RAZORPAY_BASE_URL || 'https://api.razorpay.com/v1'
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY || ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_SECRET || ''

function signaturesMatch(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)
  if (providedBuffer.length !== expectedBuffer.length) {
    return false
  }
  return timingSafeEqual(providedBuffer, expectedBuffer)
}

export async function POST(request: Request) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const razorpayOrderId = typeof body.razorpayOrderId === 'string' ? body.razorpayOrderId : ''
  const razorpayPaymentId = typeof body.razorpayPaymentId === 'string' ? body.razorpayPaymentId : ''
  const razorpaySignature = typeof body.razorpaySignature === 'string' ? body.razorpaySignature : ''

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json(
      { error: 'razorpayOrderId, razorpayPaymentId and razorpaySignature are required' },
      { status: 400 }
    )
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: 'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_SECRET.' },
      { status: 503 }
    )
  }

  const expectedSignature = createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')
  if (!signaturesMatch(razorpaySignature, expectedSignature)) {
    return NextResponse.json({ verified: false })
  }

  const res = await fetch(`${RAZORPAY_BASE_URL}/payments/${razorpayPaymentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
    },
  })

  const data = await res.json()
  const captured = res.ok && data.status === 'captured'
  if (!captured) {
    return NextResponse.json({ verified: false })
  }
  if (data.order_id !== razorpayOrderId) {
    return NextResponse.json({ verified: false })
  }

  const db = getSupabaseAdmin() ?? (await import('@cbp/supabase')).supabase
  const { data: payment } = await db
    .from('payments')
    .select('*')
    .eq('razorpay_order_id', razorpayOrderId)
    .single()
  if (!payment) {
    return NextResponse.json({ verified: false })
  }

  const { data: order } = await db.from('orders').select('*').eq('id', payment.order_id).single()
  const isOwner = order?.customer_id === user.id
  let isAgentOrAdmin = false
  if (!isOwner) {
    const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
    isAgentOrAdmin = profile?.role === 'agent' || profile?.role === 'admin'
  }
  if (!isOwner && !isAgentOrAdmin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const capturedAmount = Number(data.amount) || 0
  const orderTotalPaise = Math.round((Number(order?.total_amount) || 0) * 100)
  if (capturedAmount !== orderTotalPaise) {
    return NextResponse.json({ verified: false })
  }

  const { error: updateError } = await db
    .from('payments')
    .update({ status: 'completed', razorpay_payment_id: razorpayPaymentId })
    .eq('id', payment.id)
    .select()
    .single()
  if (updateError) {
    return NextResponse.json({ error: 'failed to reconcile payment' }, { status: 500 })
  }

  const { error: orderError } = await db
    .from('orders')
    .update({ razorpay_payment_id: razorpayPaymentId })
    .eq('id', order.id)
    .select()
    .single()
  if (orderError) {
    return NextResponse.json({ error: 'failed to reconcile payment' }, { status: 500 })
  }

  return NextResponse.json({ verified: true })
}