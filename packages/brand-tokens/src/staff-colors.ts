import { calendarColorOptions } from './calendar-colors'

export const staffColors = [
  calendarColorOptions[0].light,
  calendarColorOptions[1].light,
  calendarColorOptions[2].light,
  calendarColorOptions[3].light,
  calendarColorOptions[4].light,
] as const

export type StaffColorIndex = 0 | 1 | 2 | 3 | 4
