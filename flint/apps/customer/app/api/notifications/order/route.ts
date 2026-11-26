import { NextResponse } from 'next/server'
import { getAuthUser, getSupabaseAdmin } from '../../../../lib/api-auth'

const NOTIFICATION_TEMPLATES: Record<
  string,
  { subject: string; sms: (order: any) => string; email: (order: any) => string }
> = {
  order_confirmed: {
    subject: 'Order confirmed',
    sms: (o) => `Hi, your courier booking ${o.id} is confirmed. We will share the India Post tracking number once picked up.`,
    email: (o) => `Your courier booking ${o.id} is confirmed. Receiver: ${o.receiver_name}, destination: ${o.destination_country}, weight: ${o.weight}kg.`,
  },
  pickup_scheduled: {
    subject: 'Pickup scheduled',
    sms: (o) => `Hi, pickup scheduled for your parcel ${o.id} on ${o.scheduled_pickup_date || 'as scheduled'}.`,
    email: (o) => `Pickup scheduled for your parcel ${o.id}.`,
  },
  pickup_completed: {
    subject: 'Pickup completed',
    sms: (o) => `Hi, we picked up your parcel ${o.id}. It is on its way.`,
    email: (o) => `Pickup completed for your parcel ${o.id}.`,
  },
  shipped: {
    subject: 'Shipped',
    sms: (o) => `Hi, your parcel ${o.id} has been shipped via India Post.`,
    email: (o) => `Your parcel ${o.id} has been shipped via India Post.`,
  },
  delivered: {
    subject: 'Delivered',
    sms: (o) => `Hi, your parcel ${o.id} has been delivered. Thank you.`,
    email: (o) => `Your parcel ${o.id} has been delivered. Thank you.`,
  },
  payment_due: {
    subject: 'Payment due',
    sms: (o) => `Hi, an outstanding payment is due for your parcel ${o.id}.`,
    email: (o) => `An outstanding payment is due for your parcel ${o.id}.`,
  },
}

export async function POST(request: Request) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const orderId = typeof body.orderId === 'string' ? body.orderId : ''
  const template = typeof body.template === 'string' ? body.template : 'order_confirmed'

  const db = getSupabaseAdmin() ?? (await import('@cbp/supabase')).supabase
  const { data: order } = await db.from('orders').select('*').eq('id', orderId).single()
  if (!order) {
    return NextResponse.json({ error: 'order not found' }, { status: 404 })
  }

  const tpl = NOTIFICATION_TEMPLATES[template] ?? NOTIFICATION_TEMPLATES.order_confirmed
  const smsMessage = tpl.sms(order)
  const emailBody = tpl.email(order)

  const smsResult = await fetch('http://localhost:3000/api/notifications/sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: order.phone, message: smsMessage }),
  })
  const smsData = await smsResult.json().catch(() => null)

  const emailResult = await fetch('http://localhost:3000/api/notifications/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: order.phone, subject: tpl.subject, text: emailBody }),
  })
  const emailData = await emailResult.json().catch(() => null)

  const notificationStatus = smsResult.ok && emailResult.ok ? 'sent' : 'failed'

  const { error: notifError } = await db.from('notifications').insert({
    order_id: orderId,
    type: 'sms',
    template,
    status: notificationStatus,
    msg91_id: smsData?.msg91Id ?? null,
  })

  return NextResponse.json({
    success: true,
    notification: { template, status: notificationStatus },
  })
}