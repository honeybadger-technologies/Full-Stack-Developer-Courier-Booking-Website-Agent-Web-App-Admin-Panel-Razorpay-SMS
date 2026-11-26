import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET as getPrices } from '../../app/api/prices/route'
import { GET as getRatePrice } from '../../app/api/rates/price/route'
import { mockDbQuery } from '../helpers/mock-db'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))

vi.mock('@cbp/supabase', () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
  supabaseAdmin: { from: (...args: unknown[]) => fromMock(...args) },
  getCurrentUser: vi.fn(),
  hasRole: vi.fn(),
  getUserRole: vi.fn(),
}))

const BASE_URL = 'http://localhost:3000'

function makeRequest(path: string, init?: RequestInit) {
  return new Request(`${BASE_URL}${path}`, init)
}

describe('GET /api/prices', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('returns 400 when destination is missing', async () => {
    const res = await getPrices(makeRequest('/api/prices'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'destination is required' })
  })

  it('returns 400 when weight is missing', async () => {
    const res = await getPrices(makeRequest('/api/prices?destination=United%20Kingdom'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'weight must be a positive number' })
  })

  it('returns 400 when weight is not positive', async () => {
    const res = await getPrices(makeRequest('/api/prices?destination=United%20Kingdom&weight=0'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'weight must be a positive number' })
  })

  it('returns 404 when no active rate is configured for the destination', async () => {
    fromMock.mockReturnValue(mockDbQuery({ data: [], error: null }))
    const res = await getPrices(makeRequest('/api/prices?destination=Atlantis&weight=2'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'no rate configured for destination' })
  })

  it('returns the calculated price for the destination and weight', async () => {
    fromMock.mockReturnValue(
      mockDbQuery({
        data: [
          {
            destination_country: 'United Kingdom',
            weight_range_min: 1,
            weight_range_max: 10,
            base_rate: 150,
            margin_percent: 20,
            active: true,
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
        error: null,
      })
    )

    const res = await getPrices(makeRequest('/api/prices?destination=United%20Kingdom&weight=2'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      destination: 'United Kingdom',
      weight: 2,
      base_rate: 150,
      margin_percent: 20,
      margin: 30,
      total: 180,
      currency: 'INR',
    })
  })
})

describe('GET /api/rates/price', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('returns the calculated price for the destination and weight', async () => {
    fromMock.mockReturnValue(
      mockDbQuery({
        data: [
          {
            destination_country: 'United States',
            weight_range_min: 1,
            weight_range_max: 20,
            base_rate: 200,
            margin_percent: 25,
            active: true,
            created_at: '2026-01-02T00:00:00Z',
          },
        ],
        error: null,
      })
    )

    const res = await getRatePrice(makeRequest('/api/rates/price?destination=United%20States&weight=5'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      destination: 'United States',
      weight: 5,
      base_rate: 200,
      margin_percent: 25,
      margin: 50,
      total: 250,
      currency: 'INR',
    })
  })

  it('returns 400 when weight is not positive', async () => {
    const res = await getRatePrice(makeRequest('/api/rates/price?destination=United%20States&weight=-1'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'weight must be a positive number' })
  })
})