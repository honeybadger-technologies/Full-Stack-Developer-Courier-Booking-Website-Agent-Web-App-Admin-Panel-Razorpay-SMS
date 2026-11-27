import { describe, expect, it } from 'vitest'
import { formatPickupCount, formatPickupDate } from '../../lib/format'

describe('formatPickupCount', () => {
  it('uses the singular form for one pickup', () => {
    expect(formatPickupCount(1)).toBe('pickup')
  })

  it('uses the plural form for multiple pickups', () => {
    expect(formatPickupCount(2)).toBe('pickups')
  })
})

describe('formatPickupDate', () => {
  it('formats an ISO pickup date readably', () => {
    expect(formatPickupDate('2026-02-05T14:00:00Z')).toBe('5 Feb 2026, 14:00')
  })

  it('returns an empty string for a missing pickup date', () => {
    expect(formatPickupDate(null)).toBe('')
  })
})