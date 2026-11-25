import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/api-auth'

export async function POST(request: Request) {
  const body = await request.json()
  const razorpayOrderId = typeof body.razorpayOrderId === 'string' ? body.razorpayOrderId : ''
  const event = typeof body.event === 'string' ? body.event : 'payment.captured'

  const db = getSupabaseAdmin() ?? (await import('@cbp/supabase')).supabase
  const { data: payment } = await db.from('payments').select('*').eq('razorpay_order_id', razorpayOrderId).single()

  if (!payment) {
    return NextResponse.json({ received: true })
  }

  if (event === 'payment.captured' && payment.status !== 'completed') {
    const { error: updateError } = await db
      .from('payments')
      .update({ status: 'completed' })
      .eq('id', payment.id)
    if (updateError) {
      return NextResponse.json({ error: 'failed to reconcile payment' }, { status: 500 })
    }

    const { data: order } = await db.from('orders').select('*').eq('id', payment.order_id).single()
    if (order) {
      const { error: orderError } = await db
        .from('orders')
        .update({ status: 'shipped', razorpay_payment_id: payment.razorpay_payment_id })
        .eq('id', order.id)
      if (orderError) {
        return NextResponse.json({ error: 'failed to update order' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}