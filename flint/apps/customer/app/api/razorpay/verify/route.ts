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
  const razorpayOrderId = typeof body.razorpayOrderId === 'string' ? body.razorpayOrderId : ''
  const razorpayPaymentId = typeof body.razorpayPaymentId === 'string' ? body.razorpayPaymentId : ''

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return NextResponse.json(
      { error: 'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_SECRET.' },
      { status: 503 }
    )
  }

  const res = await fetch(`${RAZORPAY_BASE_URL}/payments/${razorpayPaymentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
    },
  })

  const data = await res.json()
  const verified = res.ok && data.status === 'captured'

  if (verified) {
    const db = getSupabaseAdmin() ?? (await import('@cbp/supabase')).supabase
    const { error: dbError } = await db
      .from('payments')
      .update({ status: 'completed', razorpay_payment_id: razorpayPaymentId })
      .eq('razorpay_order_id', razorpayOrderId)
    if (dbError) {
      return NextResponse.json({ error: 'failed to reconcile payment' }, { status: 500 })
    }
  }

  return NextResponse.json({ verified })
}