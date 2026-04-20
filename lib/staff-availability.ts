import type { BusinessHours, StaffSchedule } from './types'

export const STAFF_AVAILABILITY_CODES = {
  OUTSIDE_STAFF_HOURS: 'OUTSIDE_STAFF_HOURS',
  STAFF_INACTIVE_DAY: 'STAFF_INACTIVE_DAY',
  OUTSIDE_BUSINESS_HOURS: 'OUTSIDE_BUSINESS_HOURS',
} as const

export type StaffAvailabilityCode =
  (typeof STAFF_AVAILABILITY_CODES)[keyof typeof STAFF_AVAILABILITY_CODES]

export type StaffAvailabilityResult =
  | { ok: true; source: 'staff' | 'business'; hours: BusinessHours }
  | { ok: false; code: StaffAvailabilityCode; error: string; source: 'staff' | 'business'; hours: BusinessHours }

export function dayOfWeekFromDate(date: string): number {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return -1
  return parsed.getUTCDay()
}

export function validateAgainstHours(
  startTime: string,
  endTime: string,
  hours: Pick<BusinessHours, 'workingStart' | 'workingEnd'>
): boolean {
  return startTime >= hours.workingStart && endTime <= hours.workingEnd
}

export function validateStaffAvailability(
  params: {
    schedule: StaffSchedule | undefined
    hasAnyScheduleRows: boolean
    businessHours: BusinessHours
    startTime: string
    endTime: string
  }
): StaffAvailabilityResult {
  const { schedule, hasAnyScheduleRows, businessHours, startTime, endTime } = params

  if (schedule) {
    const hours = {
      workingStart: schedule.workingStart,
      workingEnd: schedule.workingEnd,
      slotDurationMinutes: businessHours.slotDurationMinutes,
    }

    if (!schedule.active) {
      return {
        ok: false,
        code: STAFF_AVAILABILITY_CODES.STAFF_INACTIVE_DAY,
        error: 'پرسنل انتخاب‌شده در این روز فعال نیست.',
        source: 'staff',
        hours,
      }
    }

    if (!validateAgainstHours(startTime, endTime, hours)) {
      return {
        ok: false,
        code: STAFF_AVAILABILITY_CODES.OUTSIDE_STAFF_HOURS,
        error: `این نوبت خارج از برنامه کاری پرسنل (${hours.workingStart} تا ${hours.workingEnd}) است.`,
        source: 'staff',
        hours,
      }
    }

    return { ok: true, source: 'staff', hours }
  }

  if (hasAnyScheduleRows) {
    return {
      ok: false,
      code: STAFF_AVAILABILITY_CODES.STAFF_INACTIVE_DAY,
      error: 'برای این روز برنامه کاری فعالی برای پرسنل ثبت نشده است.',
      source: 'staff',
      hours: businessHours,
    }
  }

  if (!validateAgainstHours(startTime, endTime, businessHours)) {
    return {
      ok: false,
      code: STAFF_AVAILABILITY_CODES.OUTSIDE_BUSINESS_HOURS,
      error: `این نوبت خارج از ساعت کاری سالن (${businessHours.workingStart} تا ${businessHours.workingEnd}) است.`,
      source: 'business',
      hours: businessHours,
    }
  }

  return { ok: true, source: 'business', hours: businessHours }
}
