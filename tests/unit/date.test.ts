import { describe, expect, it } from 'vitest'
import { formatDay, isDayKey, shiftDay, shiftMonth, todayDayKey } from '../../src/lib/date'

describe('Vietnam calendar days', () => {
  it('uses the Vietnam date across the UTC midnight boundary', () => {
    expect(todayDayKey(new Date('2026-11-04T17:01:00Z'))).toBe('2026-11-05')
    expect(todayDayKey(new Date('2026-11-04T16:59:00Z'))).toBe('2026-11-04')
  })
  it.each(['2026-02-29', '2026-11-31', '2026-13-01', '2026-1-01', 'garbage', '1800-01-01'])('rejects impossible or unsupported date %s', (input) => expect(isDayKey(input)).toBe(false))
  it('handles leap days and year boundaries', () => {
    expect(isDayKey('2024-02-29')).toBe(true)
    expect(shiftDay('2024-02-28', 1)).toBe('2024-02-29')
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01')
    expect(shiftMonth('2026-01-31', -1)).toBe('2025-12-01')
    expect(formatDay('2026-11-05', { day: 'numeric' })).toBe('5')
  })
})
