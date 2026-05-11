import { describe, expect, it } from 'vitest'

import { businessSettingsSchema } from './settings'

describe('businessSettingsSchema', () => {
  it('normalizes Persian digits in hours and slot duration', () => {
    const result = businessSettingsSchema.parse({
      workingStart: '۰۹:۰۰',
      workingEnd: '۱۹:۰۰',
      slotDurationMinutes: '۳۰',
    })

    expect(result).toEqual({
      workingStart: '09:00',
      workingEnd: '19:00',
      slotDurationMinutes: 30,
    })
  })

  it('rejects end before start when both are provided', () => {
    const result = businessSettingsSchema.safeParse({
      workingStart: '19:00',
      workingEnd: '09:00',
      slotDurationMinutes: 30,
    })

    expect(result.success).toBe(false)
  })
})
