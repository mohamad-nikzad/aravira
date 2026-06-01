'use client'

import { useEffect, useState } from 'react'
import {
  fetchPublicAvailability,
  type PublicAvailabilitySlot,
} from '@/lib/public-api'

function dedupeSlotsByStart(
  slots: PublicAvailabilitySlot[],
): PublicAvailabilitySlot[] {
  const seen = new Set<string>()
  const out: PublicAvailabilitySlot[] = []
  for (const slot of slots) {
    if (seen.has(slot.startTime)) continue
    seen.add(slot.startTime)
    out.push(slot)
  }
  return out.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

export function emptyReasonMessage(reason?: string): string {
  switch (reason) {
    case 'NO_QUALIFIED_STAFF':
      return 'هیچ پرسنلی برای این خدمت در دسترس نیست.'
    case 'STAFF_OFF_DAY':
    case 'ALL_QUALIFIED_STAFF_OFF_DAY':
      return 'این روز تعطیل است.'
    case 'FULLY_BOOKED':
      return 'نوبت‌های این روز پر شده است.'
    case 'OUTSIDE_SEARCH_WINDOW':
      return 'این تاریخ خارج از بازه رزرو است.'
    default:
      return 'برای این روز نوبتی پیدا نشد.'
  }
}

export type DayAvailability = {
  slots: PublicAvailabilitySlot[]
  loading: boolean
  error: string | null
  emptyReason?: string
}

/**
 * Loads availability for a single day. `active` gates the fetch so the agenda
 * layout can lazy-load each day only when it scrolls into view.
 */
export function useDayAvailability(
  slug: string,
  serviceId: string,
  ymd: string | null,
  active: boolean,
): DayAvailability {
  const [state, setState] = useState<DayAvailability>({
    slots: [],
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!active || !ymd) return
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    fetchPublicAvailability(slug, { serviceId, date: ymd })
      .then((res) => {
        if (cancelled) return
        setState({
          slots: dedupeSlotsByStart(res.slots),
          loading: false,
          error: null,
          emptyReason: res.emptyReason,
        })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setState({
          slots: [],
          loading: false,
          error:
            err instanceof Error
              ? err.message
              : 'خطا در دریافت زمان‌های موجود. لطفاً دوباره تلاش کنید.',
          emptyReason: undefined,
        })
      })
    return () => {
      cancelled = true
    }
  }, [slug, serviceId, ymd, active])

  return state
}
