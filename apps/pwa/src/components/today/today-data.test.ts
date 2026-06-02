import { describe, it, expect } from 'vitest'
import type { TodayData } from '@repo/salon-core/types'

import {
  pickTodayDisplayData,
  todayLoadingWithoutData,
} from '#/components/today/today-data'

const sampleToday = { date: '2026-06-02' } as TodayData

describe('today-data', () => {
  describe('pickTodayDisplayData', () => {
    it('prefers projected data over live', () => {
      const projected = { ...sampleToday, appointments: [] } as TodayData
      const live = { ...sampleToday, appointments: [{ id: 'a1' }] } as TodayData
      expect(pickTodayDisplayData(projected, live)).toBe(projected)
    })

    it('falls back to live when projection is undefined', () => {
      expect(pickTodayDisplayData(undefined, sampleToday)).toBe(sampleToday)
    })

    it('returns undefined when both are missing', () => {
      expect(pickTodayDisplayData(undefined, undefined)).toBeUndefined()
    })
  })

  describe('todayLoadingWithoutData', () => {
    it('is loading when queries run and no display data yet', () => {
      expect(todayLoadingWithoutData(true, false, undefined)).toBe(true)
      expect(todayLoadingWithoutData(false, true, undefined)).toBe(true)
    })

    it('is not loading once display data exists', () => {
      expect(todayLoadingWithoutData(true, true, sampleToday)).toBe(false)
    })

    it('is not loading when idle without data', () => {
      expect(todayLoadingWithoutData(false, false, undefined)).toBe(false)
    })
  })
})
