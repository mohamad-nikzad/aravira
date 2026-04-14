import type { Appointment } from './types'

/** HH:mm string overlap on same calendar day (inclusive/exclusive per existing JSON store logic). */
export function appointmentIntervalsConflict(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return (
    (aStart < bEnd && aEnd > bStart) ||
    (bStart < aEnd && bEnd > aStart) ||
    (aStart >= bStart && aEnd <= bEnd)
  )
}

export function hasAppointmentConflict(
  appointments: Pick<Appointment, 'staffId' | 'date' | 'startTime' | 'endTime' | 'status' | 'id'>[],
  staffId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): boolean {
  for (const apt of appointments) {
    if (apt.staffId !== staffId || apt.date !== date || apt.status === 'cancelled') continue
    if (excludeId && apt.id === excludeId) continue
    if (appointmentIntervalsConflict(apt.startTime, apt.endTime, startTime, endTime)) {
      return true
    }
  }
  return false
}
