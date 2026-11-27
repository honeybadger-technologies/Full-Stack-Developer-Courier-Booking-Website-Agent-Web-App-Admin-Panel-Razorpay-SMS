import { describe, expect, it } from 'vitest'
import { createOrderRequest } from '../../lib/orders'

describe('createOrderRequest', () => {
  it('attaches the bearer token when a session token is available', () => {
    const init = createOrderRequest('tok_demo_123', {
      receiverName: 'Demo Receiver',
      receiverAddress: '12 Example Street',
      destinationCountry: 'UK',
      weight: 2,
      scheduledPickupDate: '',
      phone: '9999999999',
      notes: '',
      totalAmount: 180,
    })

    expect(init.method).toBe('POST')
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok_demo_123')
    expect(JSON.parse(String(init.body))).toEqual(
      expect.objectContaining({ receiverName: 'Demo Receiver', weight: 2, totalAmount: 180 }),
    )
  })

  it('omits the authorization header when there is no token', () => {
    const init = createOrderRequest(null, {
      receiverName: 'Demo Receiver',
      receiverAddress: '12 Example Street',
      destinationCountry: 'UK',
      weight: 2,
      scheduledPickupDate: '',
      phone: '9999999999',
      notes: '',
      totalAmount: 180,
    })

    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
    expect(JSON.parse(String(init.body))).toEqual(
      expect.objectContaining({ receiverName: 'Demo Receiver', weight: 2 }),
    )
  })
})