import { describe, expect, it } from 'vitest'
import { getNextOpenSlot } from './next-open-slot'

describe('getNextOpenSlot', () => {
  it('skips past ranges and returns the next future range today', () => {
    expect(
      getNextOpenSlot({
        todayRanges: [
          { startTime: '09:00', endTime: '12:00' },
          { startTime: '17:00', endTime: '18:00' },
        ],
        tomorrowRanges: [{ startTime: '10:00', endTime: '14:00' }],
        clockHm: '16:30',
      })
    ).toEqual({
      dayLabel: 'امروز',
      startTime: '17:00',
      endTime: '18:00',
      startsNow: false,
      additionalRanges: 0,
    })
  })

  it('falls back to tomorrow when today has no remaining range', () => {
    expect(
      getNextOpenSlot({
        todayRanges: [{ startTime: '09:00', endTime: '12:00' }],
        tomorrowRanges: [
          { startTime: '09:00', endTime: '12:00' },
          { startTime: '15:00', endTime: '18:00' },
        ],
        clockHm: '21:30',
      })
    ).toEqual({
      dayLabel: 'فردا',
      startTime: '09:00',
      endTime: '12:00',
      startsNow: false,
      additionalRanges: 1,
    })
  })

  it('treats an active open range as available from now', () => {
    expect(
      getNextOpenSlot({
        todayRanges: [{ startTime: '15:00', endTime: '18:00' }],
        tomorrowRanges: [],
        clockHm: '16:10',
      })
    ).toEqual({
      dayLabel: 'امروز',
      startTime: '16:10',
      endTime: '18:00',
      startsNow: true,
      additionalRanges: 0,
    })
  })
})
