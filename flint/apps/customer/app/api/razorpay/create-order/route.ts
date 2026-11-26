import { NextResponse } from 'next/server'
import { getAuthUser, getSupabaseAdmin } from '../../../../lib/api-auth'

const RAZORPAY_BASE_URL = process.env.RAZORPAY_BASE_URL || 'https://api.razorpay.com/v1'
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY || ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_SECRET || ''

export async function POST(request: Request) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const orderId = typeof body.orderId === 'string' ? body.orderId : ''
  const amount = Number(body.amount) || 0

  const db = getSupabaseAdmin() ?? (await import('@cbp/supabase')).supabase
  const { data: order } = await db.from('orders').select('*').eq('id', orderId).single()
  if (!order) {
    return NextResponse.json({ error: 'order not found' }, { status: 404 })
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: 'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_SECRET.' },
      { status: 503 }
    )
  }

  const res = await fetch(`${RAZORPAY_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${orderId}`,
      payment_capture: 1,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json({ error: 'failed to create razorpay order' }, { status: 502 })
  }

  const razorpayOrderId = data.id as string
  const paymentLink = `https://rzp.io/${razorpayOrderId}`

  return NextResponse.json({
    razorpayOrderId,
    amount,
    currency: 'INR',
    paymentLink,
  })
}