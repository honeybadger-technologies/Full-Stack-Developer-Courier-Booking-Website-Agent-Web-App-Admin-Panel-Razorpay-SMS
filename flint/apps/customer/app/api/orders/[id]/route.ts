import { NextResponse } from 'next/server'
import { getAuthUser, getSupabaseAdmin } from '../../../../lib/api-auth'
import type { Order, OrderStatus } from '@cbp/types'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = getSupabaseAdmin() ?? (await import('@cbp/supabase')).supabase
  const { data: order, error: dbError } = await db.from('orders').select('*').eq('id', params.id).single()

  if (dbError || !order) {
    return NextResponse.json({ error: 'order not found' }, { status: 404 })
  }

  const isOwner = order.customer_id === user.id
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  return NextResponse.json(order)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, error } = await getAuthUser(request)
  if (error || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const db = getSupabaseAdmin() ?? (await import('@cbp/supabase')).supabase
  const { data: order, error: dbError } = await db.from('orders').select('*').eq('id', params.id).single()

  if (dbError || !order) {
    return NextResponse.json({ error: 'order not found' }, { status: 404 })
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'
  const isOwner = order.customer_id === user.id
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const updates: Partial<Order> = {}
  if (body.status) {
    updates.status = body.status as OrderStatus
  }
  if (typeof body.razorpay_order_id === 'string') {
    updates.razorpay_order_id = body.razorpay_order_id
  }
  if (typeof body.razorpay_payment_id === 'string') {
    updates.razorpay_payment_id = body.razorpay_payment_id
  }
  if (typeof body.total_amount === 'number') {
    updates.total_amount = body.total_amount
  }
  if (typeof body.scheduled_pickup_date === 'string') {
    updates.scheduled_pickup_date = body.scheduled_pickup_date
  }
  if (typeof body.notes === 'string') {
    updates.notes = body.notes
  }

  const { data: updated, error: updateError } = await db
    .from('orders')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ error: 'failed to update order' }, { status: 500 })
  }

  return NextResponse.json(updated)
}