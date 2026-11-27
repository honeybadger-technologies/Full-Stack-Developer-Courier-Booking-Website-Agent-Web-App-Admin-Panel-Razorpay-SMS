import { describe, expect, it } from 'vitest'
import { isDemoCheckoutEnabled } from '../../lib/demo-checkout'

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