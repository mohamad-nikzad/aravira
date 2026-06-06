import type { BusinessHours, StaffSchedule } from '@repo/salon-core/types'

import { STAFF_SCHEDULE_DAYS } from '#/components/staff/staff-schedule/days'
import {
  resolveScheduleDayActive,
  resolveScheduleDayTimes,
  scheduleRowsByDay,
} from '#/components/staff/staff-schedule/defaults'

export interface ScheduleDisplayRow {
  dayOfWeek: number
  label: string
  active: boolean
  start: string
  end: string
}

export interface ScheduleSummary {
  activeDays: Array<(typeof STAFF_SCHEDULE_DAYS)[number]>
  workDaysCount: number
  displayRows: ScheduleDisplayRow[]
}

export interface ScheduleSummaryOptions {
  businessHours?: BusinessHours
}

export function getScheduleSummary(
  schedule: StaffSchedule[] | undefined,
  options?: ScheduleSummaryOptions,
): ScheduleSummary {
  const scheduleByDay = scheduleRowsByDay(schedule)
  const businessHours = options?.businessHours

  const displayRows = STAFF_SCHEDULE_DAYS.map((day) => {
    const active = resolveScheduleDayActive(day.dayOfWeek, scheduleByDay)
    const times = resolveScheduleDayTimes(
      day.dayOfWeek,
      scheduleByDay,
      businessHours,
    )
    return {
      dayOfWeek: day.dayOfWeek,
      label: day.label,
      active,
      start: times.workingStart,
      end: times.workingEnd,
    }
  })

  const activeDays = STAFF_SCHEDULE_DAYS.filter((day) =>
    resolveScheduleDayActive(day.dayOfWeek, scheduleByDay),
  )

  return {
    activeDays,
    workDaysCount: activeDays.length,
    displayRows,
  }
}
