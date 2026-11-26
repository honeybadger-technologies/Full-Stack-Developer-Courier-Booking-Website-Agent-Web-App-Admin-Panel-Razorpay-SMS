import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH } from '../../app/api/orders/[id]/route'
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

function getOrderParams(id: string): { params: { id: string } } {
  return { params: { id } }
}

describe('GET /api/orders/[id]', () => {
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
    const res = await GET(makeRequest('/api/orders/ord_1'), getOrderParams('ord_1'))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized' })
  })

  it('returns 404 when the order does not exist', async () => {
    fromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        return mockDbQuery({ data: null, error: { message: 'not found' } })
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const res = await GET(makeRequest('/api/orders/ord_missing', { headers: AUTH }), getOrderParams('ord_missing'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'order not found' })
  })

  it('returns 403 when the order belongs to another customer', async () => {
    fromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        return mockDbQuery({
          data: { id: 'ord_other', customer_id: '22222222-2222-2222-2222-222222222222', status: 'pending' },
          error: null,
        })
      }
      if (t === 'profiles') {
        return mockDbQuery({ data: { id: CUSTOMER_ID, role: 'customer' }, error: null })
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const res = await GET(makeRequest('/api/orders/ord_other', { headers: AUTH }), getOrderParams('ord_other'))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'forbidden' })
  })

  it('returns the order for the owner', async () => {
    fromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        return mockDbQuery({ data: { id: 'ord_1', customer_id: CUSTOMER_ID, status: 'pending' }, error: null })
      }
      if (t === 'profiles') {
        return mockDbQuery({ data: { id: CUSTOMER_ID, role: 'customer' }, error: null })
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const res = await GET(makeRequest('/api/orders/ord_1', { headers: AUTH }), getOrderParams('ord_1'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id: 'ord_1', customer_id: CUSTOMER_ID, status: 'pending' })
  })
})

describe('PATCH /api/orders/[id]', () => {
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
    const res = await PATCH(
      makeRequest('/api/orders/ord_1', { method: 'PATCH', body: JSON.stringify({ status: 'shipped' }) }),
      getOrderParams('ord_1')
    )
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized' })
  })

  it('returns 404 when the order does not exist', async () => {
    fromMock.mockReset()
    fromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        return mockDbQuery({ data: null, error: { message: 'not found' } })
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const res = await PATCH(
      makeRequest('/api/orders/ord_missing', {
        method: 'PATCH',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }),
      }),
      getOrderParams('ord_missing')
    )
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'order not found' })
  })

  it('returns 403 when the order belongs to another customer', async () => {
    fromMock.mockReset()
    fromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        return mockDbQuery({
          data: { id: 'ord_other', customer_id: '22222222-2222-2222-2222-222222222222', status: 'pending' },
          error: null,
        })
      }
      if (t === 'profiles') {
        return mockDbQuery({ data: { id: CUSTOMER_ID, role: 'customer' }, error: null })
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })

    const res = await PATCH(
      makeRequest('/api/orders/ord_other', {
        method: 'PATCH',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }),
      }),
      getOrderParams('ord_other')
    )
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'forbidden' })
  })

  it('updates the order status for the owner', async () => {
    fromMock.mockReset()
    fromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        return mockDbQuery({ data: { id: 'ord_1', customer_id: CUSTOMER_ID, status: 'pending' }, error: null })
      }
      if (t === 'profiles') {
        return mockDbQuery({ data: { id: CUSTOMER_ID, role: 'customer' }, error: null })
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })
    const query = mockDbQuery({ data: { id: 'ord_1', status: 'shipped' }, error: null })
    let updateQuery: ReturnType<typeof mockDbQuery> | undefined
    let ordersCallCount = 0
    fromMock.mockImplementation((t: string) => {
      if (t === 'orders') {
        ordersCallCount += 1
        if (ordersCallCount > 1) {
          return updateQuery as ReturnType<typeof mockDbQuery>
        }
        return mockDbQuery({ data: { id: 'ord_1', customer_id: CUSTOMER_ID, status: 'pending' }, error: null })
      }
      if (t === 'profiles') {
        return mockDbQuery({ data: { id: CUSTOMER_ID, role: 'customer' }, error: null })
      }
      return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
    })
    updateQuery = query

    const res = await PATCH(
      makeRequest('/api/orders/ord_1', {
        method: 'PATCH',
        headers: { ...AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }),
      }),
      getOrderParams('ord_1')
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id: 'ord_1', status: 'shipped' })
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'shipped' }))
  })
})