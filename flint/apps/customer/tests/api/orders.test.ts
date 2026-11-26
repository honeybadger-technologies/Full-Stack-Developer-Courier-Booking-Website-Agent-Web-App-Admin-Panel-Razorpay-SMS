import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '../../app/api/orders/route'
import { mockDbQuery } from '../helpers/mock-db'

const { fromMock, authState: authStateRef } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  authState: { user: null as Record<string, unknown> | null, error: null as unknown },
}))

vi.mock('@cbp/supabase', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
  supabaseAdmin: { from: (...args: unknown[]) => fromMock(...args) },
  getCurrentUser: vi.fn(),
  hasRole: vi.fn(),
  getUserRole: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: authStateRef.user }, error: authStateRef.error })) },
    from: (...args: unknown[]) => fromMock(...args),
  })),
}))

const BASE_URL = 'http://localhost:3000'
const AUTH = { Authorization: 'Bearer demo-customer-token' }
const CUSTOMER_ID = '11111111-1111-1111-1111-111111111111'

function makeRequest(path: string, init?: RequestInit) {
  return new Request(`${BASE_URL}${path}`, init)
}

describe('GET /api/orders', () => {
  beforeEach(() => {
    fromMock.mockReset()
    authStateRef.user = {
      id: CUSTOMER_ID,
      email: 'demo@courier.com',
      role: 'customer',
      full_name: 'Demo Customer',
      phone: '9999999999',
      created_at: '2026-01-01T00:00:00Z',
    }
  })

  it('returns 401 when unauthenticated', async () => {
    const res = await GET(makeRequest('/api/orders'))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized' })
  })

  it('returns the orders for the authenticated customer', async () => {
    fromMock.mockReturnValue(mockDbQuery({ data: [{ id: 'ord_1', status: 'pending' }], error: null }))
    const res = await GET(makeRequest('/api/orders', { headers: AUTH }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 'ord_1', status: 'pending' }])
  })

  it('returns 500 when the database fails', async () => {
    fromMock.mockReturnValue(mockDbQuery({ data: null, error: { message: 'boom' } }))
    const res = await GET(makeRequest('/api/orders', { headers: AUTH }))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'failed to load orders' })
  })
})

describe('POST /api/orders', () => {
  beforeEach(() => {
    fromMock.mockReset()
    authStateRef.user = {
      id: CUSTOMER_ID,
      email: 'demo@courier.com',
      role: 'customer',
      full_name: 'Demo Customer',
      phone: '9999999999',
      created_at: '2026-01-01T00:00:00Z',
    }
  })

  it('returns 401 when unauthenticated', async () => {
    const res = await POST(makeRequest('/api/orders', { method: 'POST', body: JSON.stringify({}) }))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized' })
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(
      makeRequest('/api/orders', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverName: 'Receiver' }),
      })
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'missing required order fields' })
  })

  it('creates a pending order for the authenticated customer', async () => {
    const query = mockDbQuery({ data: { id: 'ord_new', status: 'pending' }, error: null })
    fromMock.mockReturnValue(query)

    const res = await POST(
      makeRequest('/api/orders', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverName: 'Receiver Name',
          receiverAddress: '12 Street',
          destinationCountry: 'United Kingdom',
          weight: 3,
          scheduledPickupDate: '2026-12-01',
          phone: '9999999999',
          notes: 'leave at door',
          totalAmount: 540,
        }),
      })
    )

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: 'ord_new', status: 'pending' })
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_id: CUSTOMER_ID,
        receiver_name: 'Receiver Name',
        receiver_address: '12 Street',
        destination_country: 'United Kingdom',
        weight: 3,
        status: 'pending',
        total_amount: 540,
      })
    )
  })
})