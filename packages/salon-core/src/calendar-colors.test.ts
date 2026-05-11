import { describe, expect, it } from 'vitest'
import {
  isCalendarColorId,
  normalizeCalendarColorId,
  resolveCalendarColor,
} from './calendar-colors'

describe('calendar color helpers', () => {
  it('recognizes supported calendar color ids', () => {
    expect(isCalendarColorId('rose')).toBe(true)
    expect(isCalendarColorId('bg-staff-1')).toBe(false)
  })

  it('keeps new ids and maps legacy staff color classes', () => {
    expect(normalizeCalendarColorId('mint')).toBe('mint')
    expect(normalizeCalendarColorId('bg-staff-2')).toBe('violet')
    expect(resolveCalendarColor('bg-staff-5')).toBe('coral')
  })

  it('falls back to rose for empty or unknown values', () => {
    expect(normalizeCalendarColorId(null)).toBe('rose')
    expect(normalizeCalendarColorId('something-else')).toBe('rose')
  })
})
