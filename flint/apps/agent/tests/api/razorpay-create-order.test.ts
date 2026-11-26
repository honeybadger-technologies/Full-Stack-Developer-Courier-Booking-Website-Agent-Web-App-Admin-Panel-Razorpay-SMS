import { createHmac } from 'crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as createRazorpayOrder } from '../../app/api/razorpay/create-order/route'
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
const AUTH = { Authorization: 'Bearer demo-agent-token' }
const CUSTOMER_ID = '11111111-1111-1111-1111-111111111111'
const AGENT_ID = '33333333-3333-3333-3333-333333333333'
const RAZORPAY_KEY_SECRET = 'rzp_demo_secret'

function makeRequest(path: string, init?: RequestInit) {
  return new Request(`${BASE_URL}${path}`, init)
}

function signPayment(razorpayOrderId: string, razorpayPaymentId: string) {
  return createHmac('sha256', RAZORPAY_KEY_SECRET).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex')
}

describe('POST /api/razorpay/create-order (agent)', () => {
  beforeEach(() => {
    dbFromMock.mockReset()
    authState.user = {
      id: AGENT_ID,
      email: 'demo.agent@example.com',
      role: 'agent',
      full_name: 'Demo Agent',
      phone: '9888888888',
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

  it('creates a Razorpay order for the order total and records a pending payment', async () => {
    const ordersSelect = mockDbQuery({ data: { id: 'ord_1', customer_id: CUSTOMER_ID, status: 'pending', total_amount: 360 }, error: null })
    const ordersUpdate = mockDbQuery({ data: { id: 'ord_1', razorpay_order_id: 'rzp_order_demo_1' }, error: null })
    const paymentsInsert = mockDbQuery({ data: { id: 'pay_demo_1', order_id: 'ord_1', razorpay_order_id: 'rzp_order_demo_1', amount: 360, status: 'pending' }, error: null })
    let ordersCalls = 0
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        ordersCalls += 1
        return ordersCalls === 1 ? ordersSelect : ordersUpdate
      }
      if (t === 'profiles') {
        return mockDbQuery({ data: { id: AGENT_ID, role: 'agent' }, error: null })
      }
      if (t === 'payments') {
        return paymentsInsert
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: 'rzp_order_demo_1', entity: 'order', status: 'created', payment: { id: 'pay_demo_1', status: 'captured' } }), { status: 200 })
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
    const json = await res.json()
    expect(json.razorpayOrderId).toBe('rzp_order_demo_1')
    expect(json.amount).toBe(360)

    const razorpayRequest = fetchMock.mock.calls[0][1] as RequestInit
    const razorpayBody = JSON.parse(razorpayRequest.body as string)
    expect(razorpayBody).toEqual({
      key_id: 'rzp_test_demo',
      amount: 36000,
      currency: 'INR',
      receipt: 'rcpt_ord_1',
      payment_capture: 1,
    })
    expect(razorpayBody.key_secret).toBeUndefined()

    expect(ordersUpdate.update).toHaveBeenCalledWith({ razorpay_order_id: 'rzp_order_demo_1' })
    expect(paymentsInsert.insert).toHaveBeenCalledWith({
      order_id: 'ord_1',
      razorpay_order_id: 'rzp_order_demo_1',
      amount: 360,
      status: 'pending',
    })
  })
})