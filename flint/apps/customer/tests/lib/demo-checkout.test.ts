import { describe, expect, it } from 'vitest'
import { canUseDemoCheckout, getDemoCheckoutBaseUrl, isDemoCheckoutEnabled, runDemoPayment } from '../../lib/demo-checkout'

describe('isDemoCheckoutEnabled', () => {
  it('returns true when NEXT_PUBLIC_DEMO_CHECKOUT is 1', () => {
    expect(isDemoCheckoutEnabled({ NEXT_PUBLIC_DEMO_CHECKOUT: '1' })).toBe(true)
  })

  it('returns false when the flag is not set', () => {
    expect(isDemoCheckoutEnabled({})).toBe(false)
  })

  it('returns false when the flag is set to something other than 1', () => {
    expect(isDemoCheckoutEnabled({ NEXT_PUBLIC_DEMO_CHECKOUT: '0' })).toBe(false)
    expect(isDemoCheckoutEnabled({ NEXT_PUBLIC_DEMO_CHECKOUT: 'true' })).toBe(false)
  })
})

describe('getDemoCheckoutBaseUrl', () => {
  it('returns the configured demo checkout base url', () => {
    expect(getDemoCheckoutBaseUrl({ NEXT_PUBLIC_RAZORPAY_BASE_URL: 'http://localhost:4999/v1' })).toBe(
      'http://localhost:4999/v1',
    )
  })

  it('trims whitespace from the base url', () => {
    expect(getDemoCheckoutBaseUrl({ NEXT_PUBLIC_RAZORPAY_BASE_URL: '  http://localhost:4999/v1  ' })).toBe(
      'http://localhost:4999/v1',
    )
  })

  it('returns an empty string when the base url is not configured', () => {
    expect(getDemoCheckoutBaseUrl({})).toBe('')
  })
})

describe('canUseDemoCheckout', () => {
  it('returns true when the demo flag is on and the demo base url is set', () => {
    expect(
      canUseDemoCheckout({
        NEXT_PUBLIC_DEMO_CHECKOUT: '1',
        NEXT_PUBLIC_RAZORPAY_BASE_URL: 'http://localhost:4999/v1',
      }),
    ).toBe(true)
  })

  it('returns false when the demo flag is off', () => {
    expect(
      canUseDemoCheckout({
        NEXT_PUBLIC_DEMO_CHECKOUT: '0',
        NEXT_PUBLIC_RAZORPAY_BASE_URL: 'http://localhost:4999/v1',
      }),
    ).toBe(false)
  })

  it('returns false when the demo flag is on but the demo base url is missing', () => {
    expect(
      canUseDemoCheckout({
        NEXT_PUBLIC_DEMO_CHECKOUT: '1',
        NEXT_PUBLIC_RAZORPAY_BASE_URL: '',
      }),
    ).toBe(false)
  })
})

describe('runDemoPayment', () => {
  it('runs create-order, demo checkout and verify with the razorpay order id from the create-order response', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const fakeFetch = async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url === '/api/razorpay/create-order') {
        return new Response(
          JSON.stringify({ razorpayOrderId: 'rzp_order_demo_777', amount: 18000, currency: 'INR', key_id: 'rzp_test_demo' }),
          { status: 200 },
        )
      }
      if (url === 'http://localhost:4999/v1/demo/checkout') {
        return new Response(
          JSON.stringify({ razorpayPaymentId: 'pay_demo_777', razorpaySignature: 'sig_777' }),
          { status: 200 },
        )
      }
      if (url === '/api/razorpay/verify') {
        return new Response(JSON.stringify({ verified: true }), { status: 200 })
      }
      return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })
    }

    const result = await runDemoPayment({
      orderId: 'ord_1',
      amount: 18000,
      baseUrl: 'http://localhost:4999/v1',
      authToken: 'demo-customer-token',
      fetchFn: fakeFetch,
    })

    expect(result.razorpayOrderId).toBe('rzp_order_demo_777')
    expect(result.razorpayPaymentId).toBe('pay_demo_777')
    expect(calls.map((c) => c.url)).toEqual([
      '/api/razorpay/create-order',
      'http://localhost:4999/v1/demo/checkout',
      '/api/razorpay/verify',
    ])
    const verifyCall = calls.find((c) => c.url === '/api/razorpay/verify')
    expect(verifyCall?.init?.body).toBe(
      JSON.stringify({
        razorpayOrderId: 'rzp_order_demo_777',
        razorpayPaymentId: 'pay_demo_777',
        razorpaySignature: 'sig_777',
      }),
    )
  })

  it('throws a user-facing error when the demo checkout step fails', async () => {
    const fakeFetch = async (url: string) => {
      if (url === '/api/razorpay/create-order') {
        return new Response(JSON.stringify({ razorpayOrderId: 'rzp_order_demo_778' }), { status: 200 })
      }
      return new Response(JSON.stringify({ message: 'boom' }), { status: 500 })
    }
    await expect(
      runDemoPayment({
        orderId: 'ord_1',
        amount: 18000,
        baseUrl: 'http://localhost:4999/v1',
        authToken: 'demo-customer-token',
        fetchFn: fakeFetch,
      }),
    ).rejects.toThrow(/We could not start the demo payment/)
  })

  it('throws a user-facing error when payment verification fails', async () => {
    const fakeFetch = async (url: string) => {
      if (url === '/api/razorpay/create-order') {
        return new Response(JSON.stringify({ razorpayOrderId: 'rzp_order_demo_778' }), { status: 200 })
      }
      if (url === 'http://localhost:4999/v1/demo/checkout') {
        return new Response(JSON.stringify({ razorpayPaymentId: 'pay_demo_778', razorpaySignature: 'sig_778' }), { status: 200 })
      }
      return new Response(JSON.stringify({ verified: false }), { status: 401 })
    }
    await expect(
      runDemoPayment({
        orderId: 'ord_1',
        amount: 18000,
        baseUrl: 'http://localhost:4999/v1',
        authToken: 'demo-customer-token',
        fetchFn: fakeFetch,
      }),
    ).rejects.toThrow(/We could not confirm your payment/)
  })
})