import { NextResponse } from 'next/server'
import { getAuthUser, getSupabaseAdmin } from '../../../../lib/api-auth'

export async function POST(request: Request) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const orderId = typeof body.orderId === 'string' ? body.orderId : ''
  const paymentMethod = typeof body.method === 'string' ? body.method : 'bank_transfer'
  const amount = Number(body.amount) || 0
  const reference = typeof body.reference === 'string' ? body.reference : ''

  const db = getSupabaseAdmin() ?? (await import('@cbp/supabase')).supabase
  const { data: order } = await db.from('orders').select('*').eq('id', orderId).single()
  if (!order) {
    return NextResponse.json({ error: 'order not found' }, { status: 404 })
  }

  const { data: payment, error: dbError } = await db
    .from('payments')
    .upsert(
      {
        order_id: orderId,
        razorpay_order_id: order.razorpay_order_id,
        razorpay_payment_id: order.razorpay_payment_id,
        amount,
        status: 'completed',
        payment_method: paymentMethod,
        reference: reference || null,
      },
      { onConflict: 'order_id' }
    )
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: 'failed to record payment' }, { status: 500 })
  }

  return NextResponse.json({ success: true, payment })
}