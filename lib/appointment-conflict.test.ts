import { describe, it, expect } from 'vitest'
import {
  appointmentIntervalsConflict,
  hasAppointmentConflict,
} from '@/lib/appointment-conflict'

describe('appointmentIntervalsConflict', () => {
  it('returns true when ranges overlap', () => {
    expect(appointmentIntervalsConflict('09:00', '10:00', '09:30', '10:30')).toBe(true)
  })

  it('returns false when ranges are adjacent without overlap', () => {
    expect(appointmentIntervalsConflict('09:00', '10:00', '10:00', '11:00')).toBe(false)
  })
})

describe('hasAppointmentConflict', () => {
  it('ignores cancelled appointments', () => {
    const ok = hasAppointmentConflict(
      [
        {
          id: '1',
          staffId: 'a',
          date: '2026-01-01',
          startTime: '09:00',
          endTime: '10:00',
          status: 'cancelled',
        },
      ],
      'a',
      '2026-01-01',
      '09:30',
      '10:30'
    )
    expect(ok).toBe(false)
  })

  it('detects conflict with scheduled appointment', () => {
    const bad = hasAppointmentConflict(
      [
        {
          id: '1',
          staffId: 'a',
          date: '2026-01-01',
          startTime: '09:00',
          endTime: '10:00',
          status: 'scheduled',
        },
      ],
      'a',
      '2026-01-01',
      '09:30',
      '10:30'
    )
    expect(bad).toBe(true)
  })
})
