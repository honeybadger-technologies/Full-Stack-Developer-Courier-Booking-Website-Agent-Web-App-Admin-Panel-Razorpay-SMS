import { describe, expect, it } from 'vitest'
import { formatPickupCount, formatPickupDate } from '../../lib/format'

describe('formatPickupCount', () => {
  it('includes the number for a single pickup', () => {
    expect(formatPickupCount(1)).toBe('1 pickup')
  })

  it('includes the number for multiple pickups', () => {
    expect(formatPickupCount(2)).toBe('2 pickups')
  })

  it('includes the number for zero pickups', () => {
    expect(formatPickupCount(0)).toBe('0 pickups')
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