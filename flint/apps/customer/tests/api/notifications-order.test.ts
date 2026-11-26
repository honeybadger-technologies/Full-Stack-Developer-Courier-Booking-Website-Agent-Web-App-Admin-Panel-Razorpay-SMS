import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../../app/api/notifications/order/route'
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

describe('POST /api/notifications/order', () => {
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
    const res = await POST(
      makeRequest('/api/notifications/order', {
        method: 'POST',
        headers: { Authorization: '', 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'ord_1', template: 'order_confirmed' }),
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

    const res = await POST(
      makeRequest('/api/notifications/order', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'ord_missing', template: 'order_confirmed' }),
      })
    )
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'order not found' })
  })

  it('sends SMS and email notifications for the order and records the notification', async () => {
    dbFromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        return mockDbQuery({
          data: {
            id: 'ord_1',
            customer_id: '11111111-1111-1111-1111-111111111111',
            receiver_name: 'Receiver Name',
            receiver_address: '12 Street',
            destination_country: 'United Kingdom',
            weight: 2,
            scheduled_pickup_date: null,
            status: 'pending',
            razorpay_order_id: null,
            razorpay_payment_id: null,
            total_amount: 360,
            phone: '9999999999',
            notes: null,
            created_at: '2026-01-01T00:00:00Z',
          },
          error: null,
        })
      }
      if (t === 'notifications') {
        return mockDbQuery({ data: { id: 'ntf_1' }, error: null })
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes('/sms')) {
        return new Response(JSON.stringify({ type: 'success', messageId: 'msg91_mock_1' }), { status: 200 })
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await POST(
      makeRequest('/api/notifications/order', {
        method: 'POST',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'ord_1', template: 'order_confirmed' }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      notification: { template: 'order_confirmed', status: 'sent' },
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const emailCall = fetchMock.mock.calls.find((call) => String(call[0]).includes('/email'))
    expect(emailCall).toBeDefined()
    const emailBody = JSON.parse((emailCall?.[1] as RequestInit)?.body as string)
    expect(emailBody.subject).toBe('Order confirmed')
    expect(typeof emailBody.text).toBe('string')
    expect(emailBody.text).toContain('ord_1')
  })
})