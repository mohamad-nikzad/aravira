import { describe, expect, it } from 'vitest'
import { secureCompare } from './secure-compare'

describe('secureCompare', () => {
  it('returns true for matching strings', () => {
    expect(secureCompare('abc-123', 'abc-123')).toBe(true)
  })

  it('returns false for mismatched strings of equal length', () => {
    expect(secureCompare('abc-123', 'xyz-999')).toBe(false)
  })

  it('returns false when lengths differ', () => {
    expect(secureCompare('short', 'much-longer-value')).toBe(false)
  })

  it('returns false for null or empty provided values', () => {
    expect(secureCompare('secret', null)).toBe(false)
    expect(secureCompare('secret', '')).toBe(false)
    expect(secureCompare('secret', undefined)).toBe(false)
  })
})
