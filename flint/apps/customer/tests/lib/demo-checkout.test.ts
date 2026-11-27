import { describe, expect, it } from 'vitest'
import { canUseDemoCheckout, getDemoCheckoutBaseUrl, isDemoCheckoutEnabled } from '../../lib/demo-checkout'

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