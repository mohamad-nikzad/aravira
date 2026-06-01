'use client'

import { useMemo } from 'react'
import { JALALI_MONTHS, parseGregorianToJalali } from '@repo/salon-core/jalali'
import { toPersianDigits } from '@repo/salon-core/persian-digits'

const PERSIAN_WEEKDAYS = [
  'شنبه',
  'یک‌شنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
]
const PERSIAN_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] // Saturday-first

function dayOfWeekIranian(ymd: string): number {
  const date = new Date(ymd + 'T00:00:00')
  return (date.getDay() + 1) % 7
}

export type PublicDate = {
  ymd: string
  weekday: string
  weekdayShort: string
  /** Jalali day-of-month, already converted to Persian digits. */
  day: string
  month: string
  /** Jalali month number (1–12), for grouping/month-break detection. */
  jm: number
}

export function toPublicDates(ymds: string[]): PublicDate[] {
  return ymds.map((ymd) => {
    const { jm, jd } = parseGregorianToJalali(ymd)
    const dow = dayOfWeekIranian(ymd)
    return {
      ymd,
      weekday: PERSIAN_WEEKDAYS[dow]!,
      weekdayShort: PERSIAN_WEEKDAYS_SHORT[dow]!,
      day: toPersianDigits(jd),
      month: JALALI_MONTHS[jm - 1]!,
      jm,
    }
  })
}

export function usePublicDates(ymds: string[]): PublicDate[] {
  return useMemo(() => toPublicDates(ymds), [ymds])
}
