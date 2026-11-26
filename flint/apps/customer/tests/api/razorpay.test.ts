import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as createRazorpayOrder } from '../../app/api/razorpay/create-order/route'
import { POST as verifyRazorpayPayment } from '../../app/api/razorpay/verify/route'
import { mockDbQuery } from '../helpers/mock-db'

const { fromMock: dbFromMock, authState } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  authState: { user: null as Record<string, unknown> | null, error: null as unknown },
}))

vi.mock('@cbp/supabase', () => ({
  supabase: { from: (...args: unknown[]) => dbFromMock(...args) },
  supabaseAdmin: { from: (...args: unknown[]) => dbFromMock(...args) },
  getCurrentUser: vi.fn(),
  hasRole: vi.fn(),
  getUserRole: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: authState.user }, error: authState.error })) },
    from: (...args: unknown[]) => dbFromMock(...args),
  })),
}))

const BASE_URL = 'http://localhost:3000'
const AUTH = { Authorization: 'Bearer demo-customer-token' }

function makeRequest(path: string, init?: RequestInit) {
  return new Request(`${BASE_URL}${path}`, init)
}

describe('POST /api/razorpay/create-order', () => {
  beforeEach(() => {
    dbFromMock.mockReset()
    authState.user = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'demo@courier.com',
      role: 'customer',
      full_name: 'Demo Customer',
      phone: '9999999999',
      created_at: '2026-01-01T00:00:00Z',
    }
  })

  it('returns 401 when unauthenticated', async () => {
    const res = await createRazorpayOrder(
      makeRequest('/api/razorpay/create-order', {
        method: 'POST',
        headers: { Authorization: '', 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'ord_1', amount: 500 }),
      })
    )
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized' })
  })

  it('returns 404 when the order does not exist', async () => {
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        return mockDbQuery({ data: null, error: { message: 'not found' } })
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const res = await createRazorpayOrder(
      makeRequest('/api/razorpay/create-order', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'ord_missing', amount: 500 }),
      })
    )
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'order not found' })
  })

  it('creates a Razorpay order through the configured gateway', async () => {
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        return mockDbQuery({
          data: { id: 'ord_1', customer_id: '11111111-1111-1111-1111-111111111111', status: 'pending' },
          error: null,
        })
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: 'rzp_order_demo_1', entity: 'order', status: 'created' }), { status: 200 })
    )
    vi.stubGlobal('fetch', fetchMock)

    const res = await createRazorpayOrder(
      makeRequest('/api/razorpay/create-order', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'ord_1', amount: 500 }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      razorpayOrderId: 'rzp_order_demo_1',
      amount: 500,
      currency: 'INR',
      paymentLink: 'https://rzp.io/rzp_order_demo_1',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4999/v1/orders',
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('POST /api/razorpay/verify', () => {
  beforeEach(() => {
    dbFromMock.mockReset()
    authState.user = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'demo@courier.com',
      role: 'customer',
      full_name: 'Demo Customer',
      phone: '9999999999',
      created_at: '2026-01-01T00:00:00Z',
    }
  })

  it('returns 401 when unauthenticated', async () => {
    const res = await verifyRazorpayPayment(
      makeRequest('/api/razorpay/verify', {
        method: 'POST',
        headers: { Authorization: '', 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayOrderId: 'rzp_order_demo_1', razorpayPaymentId: 'pay_demo_1' }),
      })
    )
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized' })
  })

  it('returns verified true only when the payment is captured', async () => {
    const update = mockDbQuery({ data: { id: 'pay_1', status: 'completed' }, error: null })
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'payments') {
        return update
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: 'pay_demo_1', entity: 'payment', status: 'captured' }), { status: 200 })
    )
    vi.stubGlobal('fetch', fetchMock)

    const res = await verifyRazorpayPayment(
      makeRequest('/api/razorpay/verify', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayOrderId: 'rzp_order_demo_1', razorpayPaymentId: 'pay_demo_1' }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ verified: true })
    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed', razorpay_payment_id: 'pay_demo_1' })
    )
  })

  it('returns verified false when the payment is not captured', async () => {
    const update = mockDbQuery({ data: { id: 'pay_1', status: 'pending' }, error: null })
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'payments') {
        return update
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: 'pay_demo_1', entity: 'payment', status: 'pending' }), { status: 200 })
    )
    vi.stubGlobal('fetch', fetchMock)

    const res = await verifyRazorpayPayment(
      makeRequest('/api/razorpay/verify', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayOrderId: 'rzp_order_demo_1', razorpayPaymentId: 'pay_demo_1' }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ verified: false })
    expect(update.update).not.toHaveBeenCalled()
  })
})