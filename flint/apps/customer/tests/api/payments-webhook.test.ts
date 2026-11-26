import { createHmac } from 'crypto'
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
const RAZORPAY_WEBHOOK_SECRET = 'rzp_webhook_demo_secret'

function makeRequest(path: string, init?: RequestInit) {
  return new Request(`${BASE_URL}${path}`, init)
}

function signWebhookPayload(rawBody: string) {
  return createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex')
}

function capturedEventBody(orderId: string, amount: number) {
  const payload = { event: 'payment.captured', payload: { payment: { entity: { order_id: orderId, amount } } } }
  return { rawBody: JSON.stringify(payload), signature: signWebhookPayload(JSON.stringify(payload)) }
}

describe('POST /api/payments/webhook', () => {
  beforeEach(() => {
    dbFromMock.mockReset()
  })

  it('returns 400 when the webhook signature is missing', async () => {
    const { rawBody } = capturedEventBody('rzp_1', 360)
    const res = await POST(
      makeRequest('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: rawBody,
      })
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid signature' })
  })

  it('returns 400 when the webhook signature is invalid', async () => {
    const { rawBody } = capturedEventBody('rzp_1', 360)
    const res = await POST(
      makeRequest('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': 'wrong-signature' },
        body: rawBody,
      })
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid signature' })
  })

  it('returns received true when no payment matches the order', async () => {
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'payments') {
        return mockDbQuery({ data: null, error: { message: 'not found' } })
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const { rawBody, signature } = capturedEventBody('rzp_missing', 360)
    const res = await POST(
      makeRequest('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': signature },
        body: rawBody,
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
  })

  it('marks the payment completed on a valid payment.captured event without shipping the order', async () => {
    const paymentsSelect = mockDbQuery({ data: { id: 'pay_1', order_id: 'ord_1', razorpay_order_id: 'rzp_1', razorpay_payment_id: 'pay_9', amount: 360, status: 'pending' }, error: null })
    const paymentsUpdate = mockDbQuery({ data: { id: 'pay_1', status: 'completed', razorpay_payment_id: 'pay_9' }, error: null })
    const ordersSelect = mockDbQuery({ data: { id: 'ord_1', status: 'pending', total_amount: 360 }, error: null })
    let paymentCalls = 0
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'payments') {
        paymentCalls += 1
        return paymentCalls === 1 ? paymentsSelect : paymentsUpdate
      }
      if (t === 'orders') {
        return ordersSelect
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const { rawBody, signature } = capturedEventBody('rzp_1', 360)
    const res = await POST(
      makeRequest('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': signature },
        body: rawBody,
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
    expect(paymentsUpdate.update).toHaveBeenCalledWith({ status: 'completed', razorpay_payment_id: 'pay_9' })
    expect(ordersSelect.update).not.toHaveBeenCalled()
  })

  it('does not mark the payment completed when the captured amount does not match the order total', async () => {
    const paymentsSelect = mockDbQuery({ data: { id: 'pay_1', order_id: 'ord_1', razorpay_order_id: 'rzp_1', razorpay_payment_id: 'pay_9', amount: 500, status: 'pending' }, error: null })
    const paymentsUpdate = mockDbQuery({ data: { id: 'pay_1', status: 'completed', razorpay_payment_id: 'pay_9' }, error: null })

    dbFromMock.mockImplementation((t: string) => {
      if (t === 'payments') {
        return paymentsSelect
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const { rawBody, signature } = capturedEventBody('rzp_1', 500)
    const res = await POST(
      makeRequest('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': signature },
        body: rawBody,
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
    expect(paymentsUpdate.update).not.toHaveBeenCalled()
  })

  it('does not mark the payment completed when the event is not payment.captured', async () => {
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'payments') {
        return mockDbQuery({ data: { id: 'pay_1', order_id: 'ord_1', razorpay_order_id: 'rzp_1', razorpay_payment_id: 'pay_9', amount: 360, status: 'pending' }, error: null })
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const payload = { event: 'payment.failed', payload: { payment: { entity: { order_id: 'rzp_1', amount: 360 } } } }
    const rawBody = JSON.stringify(payload)
    const res = await POST(
      makeRequest('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': signWebhookPayload(rawBody) },
        body: rawBody,
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
    expect(dbFromMock).not.toHaveBeenCalled()
  })
})