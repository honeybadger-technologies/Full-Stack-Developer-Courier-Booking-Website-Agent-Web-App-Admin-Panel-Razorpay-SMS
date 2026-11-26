import { createHmac } from 'crypto'
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
const CUSTOMER_ID = '11111111-1111-1111-1111-111111111111'
const AGENT_ID = '33333333-3333-3333-3333-333333333333'
const RAZORPAY_KEY_SECRET = 'rzp_demo_secret'

function makeRequest(path: string, init?: RequestInit) {
  return new Request(`${BASE_URL}${path}`, init)
}

function signPayment(razorpayOrderId: string, razorpayPaymentId: string) {
  return createHmac('sha256', RAZORPAY_KEY_SECRET).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex')
}

function signWebhookPayload(rawBody: string) {
  return createHmac('sha256', 'rzp_webhook_demo_secret').update(rawBody).digest('hex')
}

describe('POST /api/razorpay/create-order', () => {
  beforeEach(() => {
    dbFromMock.mockReset()
    authState.user = {
      id: CUSTOMER_ID,
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

  it('creates a Razorpay order for the order total and records a pending payment', async () => {
    const ordersSelect = mockDbQuery({ data: { id: 'ord_1', customer_id: CUSTOMER_ID, status: 'pending', total_amount: 360 }, error: null })
    const ordersUpdate = mockDbQuery({ data: { id: 'ord_1', razorpay_order_id: 'rzp_order_demo_1' }, error: null })
    const paymentsSelect = mockDbQuery({ data: null, error: null })
    const paymentsInsert = mockDbQuery({ data: { id: 'pay_demo_1', order_id: 'ord_1', razorpay_order_id: 'rzp_order_demo_1', amount: 360, status: 'pending' }, error: null })
    let ordersCalls = 0
    let paymentsCalls = 0
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        ordersCalls += 1
        return ordersCalls === 1 ? ordersSelect : ordersUpdate
      }
      if (t === 'payments') {
        paymentsCalls += 1
        return paymentsCalls === 1 ? paymentsSelect : paymentsInsert
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
    expect(await res.json()).toEqual({
      razorpayOrderId: 'rzp_order_demo_1',
      amount: 36000,
      currency: 'INR',
      key_id: 'rzp_test_demo',
    })

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4999/v1/orders', expect.objectContaining({ method: 'POST' }))
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

  it('returns the existing Razorpay order when the order already has a pending payment', async () => {
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        return mockDbQuery({ data: { id: 'ord_1', customer_id: CUSTOMER_ID, status: 'pending', total_amount: 360 }, error: null })
      }
      if (t === 'payments') {
        return mockDbQuery({ data: { id: 'pay_demo_1', order_id: 'ord_1', razorpay_order_id: 'rzp_order_demo_1', amount: 360, status: 'pending' }, error: null })
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
      amount: 36000,
      currency: 'INR',
      key_id: 'rzp_test_demo',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns 403 when the order belongs to another customer', async () => {
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        return mockDbQuery({ data: { id: 'ord_other', customer_id: '22222222-2222-2222-2222-222222222222', status: 'pending', total_amount: 100 }, error: null })
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const res = await createRazorpayOrder(
      makeRequest('/api/razorpay/create-order', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'ord_other', amount: 100 }),
      })
    )

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'forbidden' })
  })

  it('allows an agent to create a Razorpay order for a customer order', async () => {
    authState.user = {
      id: AGENT_ID,
      email: 'demo.agent@example.com',
      role: 'agent',
      full_name: 'Demo Agent',
      phone: '9888888888',
      created_at: '2026-01-01T00:00:00Z',
    }
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        return mockDbQuery({ data: { id: 'ord_1', customer_id: CUSTOMER_ID, status: 'pending', total_amount: 360 }, error: null })
      }
      if (t === 'profiles') {
        return mockDbQuery({ data: { id: AGENT_ID, role: 'agent' }, error: null })
      }
      if (t === 'payments') {
        return mockDbQuery({ data: null, error: null })
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
    const json = await res.json()
    expect(json.razorpayOrderId).toBe('rzp_order_demo_1')
    expect(json.amount).toBe(36000)
    expect(json.key_id).toBe('rzp_test_demo')
  })
})

describe('POST /api/razorpay/verify', () => {
  beforeEach(() => {
    dbFromMock.mockReset()
    authState.user = {
      id: CUSTOMER_ID,
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
        body: JSON.stringify({ razorpayOrderId: 'rzp_order_demo_1', razorpayPaymentId: 'pay_demo_1', razorpaySignature: signPayment('rzp_order_demo_1', 'pay_demo_1') }),
      })
    )
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized' })
  })

  it('returns 400 when the razorpay signature is missing', async () => {
    const res = await verifyRazorpayPayment(
      makeRequest('/api/razorpay/verify', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayOrderId: 'rzp_order_demo_1', razorpayPaymentId: 'pay_demo_1' }),
      })
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'razorpayOrderId, razorpayPaymentId and razorpaySignature are required' })
  })

  it('returns verified false and does not reconcile when the signature is invalid', async () => {
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
        body: JSON.stringify({ razorpayOrderId: 'rzp_order_demo_1', razorpayPaymentId: 'pay_demo_1', razorpaySignature: 'tampered-signature' }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ verified: false })
    expect(update.update).not.toHaveBeenCalled()
  })

  it('returns verified false when the gateway reports the payment is not captured', async () => {
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
        body: JSON.stringify({ razorpayOrderId: 'rzp_order_demo_1', razorpayPaymentId: 'pay_demo_1', razorpaySignature: signPayment('rzp_order_demo_1', 'pay_demo_1') }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ verified: false })
    expect(update.update).not.toHaveBeenCalled()
  })

  it('returns verified false when the captured amount does not match the order total', async () => {
    const paymentsSelect = mockDbQuery({ data: { id: 'pay_1', order_id: 'ord_1', razorpay_order_id: 'rzp_order_demo_1', razorpay_payment_id: 'pay_demo_1', amount: 500, status: 'pending' }, error: null })
    const paymentsUpdate = mockDbQuery({ data: { id: 'pay_1', status: 'completed' }, error: null })
    const ordersSelect = mockDbQuery({ data: { id: 'ord_1', customer_id: CUSTOMER_ID, status: 'pending', total_amount: 360 }, error: null })
    let ordersCalls = 0
    let paymentsCalls = 0
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        ordersCalls += 1
        return ordersCalls === 1 ? ordersSelect : mockDbQuery({ data: null, error: { message: 'orders should not be updated' } })
      }
      if (t === 'payments') {
        paymentsCalls += 1
        return paymentsCalls === 1 ? paymentsSelect : paymentsUpdate
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: 'pay_demo_1', entity: 'payment', status: 'captured', order_id: 'rzp_order_demo_1', amount: 50000 }), { status: 200 })
    )
    vi.stubGlobal('fetch', fetchMock)

    const res = await verifyRazorpayPayment(
      makeRequest('/api/razorpay/verify', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayOrderId: 'rzp_order_demo_1', razorpayPaymentId: 'pay_demo_1', razorpaySignature: signPayment('rzp_order_demo_1', 'pay_demo_1') }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ verified: false })
    expect(paymentsUpdate.update).not.toHaveBeenCalled()
  })

  it('marks the payment completed and records the payment id on the order after a valid signature', async () => {
    const ordersSelect = mockDbQuery({ data: { id: 'ord_1', customer_id: CUSTOMER_ID, status: 'pending', total_amount: 360, razorpay_order_id: 'rzp_order_demo_1', razorpay_payment_id: null }, error: null })
    const ordersUpdate = mockDbQuery({ data: { id: 'ord_1', razorpay_payment_id: 'pay_demo_1' }, error: null })
    const paymentsSelect = mockDbQuery({ data: { id: 'pay_1', order_id: 'ord_1', razorpay_order_id: 'rzp_order_demo_1', razorpay_payment_id: 'pay_demo_1', amount: 360, status: 'pending' }, error: null })
    const paymentsUpdate = mockDbQuery({ data: { id: 'pay_1', status: 'completed', razorpay_payment_id: 'pay_demo_1' }, error: null })
    let ordersCalls = 0
    let paymentsCalls = 0
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        ordersCalls += 1
        return ordersCalls === 1 ? ordersSelect : ordersUpdate
      }
      if (t === 'payments') {
        paymentsCalls += 1
        return paymentsCalls === 1 ? paymentsSelect : paymentsUpdate
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: 'pay_demo_1', entity: 'payment', status: 'captured', order_id: 'rzp_order_demo_1', amount: 36000 }), { status: 200 })
    )
    vi.stubGlobal('fetch', fetchMock)

    const res = await verifyRazorpayPayment(
      makeRequest('/api/razorpay/verify', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayOrderId: 'rzp_order_demo_1', razorpayPaymentId: 'pay_demo_1', razorpaySignature: signPayment('rzp_order_demo_1', 'pay_demo_1') }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ verified: true })
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4999/v1/payments/pay_demo_1', expect.objectContaining({ method: 'GET' }))
    expect(paymentsUpdate.update).toHaveBeenCalledWith({ status: 'completed', razorpay_payment_id: 'pay_demo_1' })
    expect(ordersUpdate.update).toHaveBeenCalledWith({ razorpay_payment_id: 'pay_demo_1' })
  })
})