import { NextResponse } from 'next/server'
import { getAuthUser, getSupabaseAdmin } from '../../../lib/api-auth'
import type { Order } from '@cbp/types'

export async function GET(request: Request) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdmin() ?? (await import('@cbp/supabase')).supabase
  const { data: orders, error: dbError } = await db
    .from('orders')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  if (dbError) {
    return NextResponse.json({ error: 'failed to load orders' }, { status: 500 })
  }

  return NextResponse.json(orders)
}

export async function POST(request: Request) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const receiverName = typeof body.receiverName === 'string' ? body.receiverName.trim() : ''
  const receiverAddress = typeof body.receiverAddress === 'string' ? body.receiverAddress.trim() : ''
  const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.trim() : ''
  const weight = Number(body.weight)
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''

  if (!receiverName || !receiverAddress || !destinationCountry || !weight || weight <= 0) {
    return NextResponse.json({ error: 'missing required order fields' }, { status: 400 })
  }

  const db = getSupabaseAdmin() ?? (await import('@cbp/supabase')).supabase
  const totalAmount = Number(body.totalAmount) || 0

  const { data: order, error: dbError } = await db
    .from('orders')
    .insert({
      customer_id: user.id,
      receiver_name: receiverName,
      receiver_address: receiverAddress,
      destination_country: destinationCountry,
      weight,
      scheduled_pickup_date: body.scheduledPickupDate || null,
      status: 'pending',
      razorpay_order_id: null,
      razorpay_payment_id: null,
      total_amount: totalAmount,
      phone: phone || null,
      notes: typeof body.notes === 'string' ? body.notes : null,
    })
    .select()
    .single()

  if (dbError || !order) {
    return NextResponse.json({ error: 'failed to create order' }, { status: 500 })
  }

  return NextResponse.json(order, { status: 201 })
}