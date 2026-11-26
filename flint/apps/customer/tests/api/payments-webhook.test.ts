import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../../app/api/payments/webhook/route'
import { mockDbQuery } from '../helpers/mock-db'

const { fromMock: dbFromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))

vi.mock('@cbp/supabase', () => ({
  supabase: { from: (...args: unknown[]) => dbFromMock(...args) },
  supabaseAdmin: { from: (...args: unknown[]) => dbFromMock(...args) },
  getCurrentUser: vi.fn(),
  hasRole: vi.fn(),
  getUserRole: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null }, error: null })) },
    from: (...args: unknown[]) => dbFromMock(...args),
  })),
}))

const BASE_URL = 'http://localhost:3000'

function makeRequest(path: string, init?: RequestInit) {
  return new Request(`${BASE_URL}${path}`, init)
}

/**
 * Mocks per-table sequential call results, e.g. for flows that select then update.
 */
function mockTableResults(results: Record<string, Array<{ data: unknown; error?: unknown }>>) {
  const counters: Record<string, number> = {}
  dbFromMock.mockImplementation((t: string) => {
    const calls = counters[t] ?? 0
    counters[t] = calls + 1
    const list = results[t] ?? [{ data: null, error: { message: 'not found' } }]
    return mockDbQuery(list[calls] ?? { data: null, error: { message: 'not found' } })
  })
}

describe('POST /api/payments/webhook', () => {
  beforeEach(() => {
    dbFromMock.mockReset()
  })

  it('returns received true when no payment matches the order', async () => {
    mockTableResults({ payments: [{ data: null, error: { message: 'not found' } }] })

    const res = await POST(
      makeRequest('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayOrderId: 'rzp_missing', event: 'payment.captured' }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
  })

  it('marks the payment completed and the order shipped on payment.captured', async () => {
    mockTableResults({
      payments: [
        { data: { id: 'pay_1', order_id: 'ord_1', razorpay_order_id: 'rzp_1', razorpay_payment_id: 'pay_9', status: 'pending' }, error: null },
        { data: { id: 'pay_1', status: 'completed' }, error: null },
      ],
      orders: [
        {
          data: { id: 'ord_1', customer_id: '11111111-1111-1111-1111-111111111111', status: 'pending' },
          error: null,
        },
        { data: { id: 'ord_1', status: 'shipped', razorpay_payment_id: 'pay_9' }, error: null },
      ],
    })

    const res = await POST(
      makeRequest('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayOrderId: 'rzp_1', event: 'payment.captured' }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
  })

  it('does not touch the order when the event is not payment.captured', async () => {
    mockTableResults({
      payments: [
        { data: { id: 'pay_1', order_id: 'ord_1', razorpay_order_id: 'rzp_1', razorpay_payment_id: 'pay_9', status: 'pending' }, error: null },
      ],
      orders: [{ data: { id: 'ord_1', status: 'pending' }, error: null }],
    })

    const res = await POST(
      makeRequest('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayOrderId: 'rzp_1', event: 'payment.failed' }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
  })
})