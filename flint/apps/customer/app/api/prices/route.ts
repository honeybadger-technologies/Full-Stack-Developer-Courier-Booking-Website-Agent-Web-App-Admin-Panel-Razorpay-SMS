import { NextResponse } from 'next/server'
import { supabase } from '@cbp/supabase'
import { resolveDestination } from '../../../lib/destinations'
import type { PriceResult } from '@cbp/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const destination = searchParams.get('destination')?.trim()
  const weight = parseFloat(searchParams.get('weight') || '')

  if (!destination) {
    return NextResponse.json({ error: 'destination is required' }, { status: 400 })
  }
  if (!weight || weight <= 0) {
    return NextResponse.json({ error: 'weight must be a positive number' }, { status: 400 })
  }

  const { data: rates, error } = await supabase
    .from('rates')
    .select('*')
    .eq('destination_country', resolveDestination(destination))
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'failed to load rates' }, { status: 500 })
  }

  const rate = rates?.[0]
  if (!rate) {
    return NextResponse.json({ error: 'no rate configured for destination' }, { status: 404 })
  }

  const baseRate = Number(rate.base_rate)
  const marginPercent = Number(rate.margin_percent)
  const margin = Math.round((baseRate * marginPercent) / 100 * 100) / 100
  const total = Math.round((baseRate * (1 + marginPercent / 100)) * 100) / 100

  const result: PriceResult & { margin_percent?: number; currency?: string } = {
    destination: rate.destination_country,
    weight,
    base_rate: baseRate,
    margin_percent: marginPercent,
    margin,
    total,
    currency: 'INR',
  }

  return NextResponse.json(result)
}