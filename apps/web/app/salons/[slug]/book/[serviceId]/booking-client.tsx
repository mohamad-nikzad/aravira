'use client'

import { useEffect, useMemo, useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { JALALI_MONTHS, parseGregorianToJalali } from '@repo/salon-core/jalali'
import { toPersianDigits } from '@repo/salon-core/persian-digits'
import {
  fetchPublicAvailability,
  submitAppointmentRequest,
  type PublicAvailabilitySlot,
} from '../../../_lib/public-api'
import { formatDuration, formatHm, formatPrice } from '../../../_lib/format'

type ServiceSummary = {
  id: string
  name: string
  duration: number
  price: number
}

type Props = {
  slug: string
  service: ServiceSummary
  dates: string[]
}

const PERSIAN_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] // Saturday-first

function dayOfWeekIranian(ymd: string): number {
  const date = new Date(ymd + 'T00:00:00')
  return (date.getDay() + 1) % 7
}

function addMinutesToHm(hm: string, minutes: number): string {
  const [h, m] = hm.split(':').map(Number)
  const total = h! * 60 + m! + minutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

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

function emptyReasonMessage(reason?: string): string {
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

export function BookingClient({ slug, service, dates }: Props) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string>(dates[0] ?? '')
  const [slots, setSlots] = useState<PublicAvailabilitySlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsEmptyReason, setSlotsEmptyReason] = useState<string | undefined>(
    undefined,
  )
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [selectedStart, setSelectedStart] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, startSubmit] = useTransition()

  useEffect(() => {
    if (!selectedDate) return
    let cancelled = false
    setSlotsLoading(true)
    setSlotsError(null)
    setSelectedStart(null)
    fetchPublicAvailability(slug, {
      serviceId: service.id,
      date: selectedDate,
    })
      .then((res) => {
        if (cancelled) return
        setSlots(dedupeSlotsByStart(res.slots))
        setSlotsEmptyReason(res.emptyReason)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof Error
            ? err.message
            : 'خطا در دریافت زمان‌های موجود. لطفاً دوباره تلاش کنید.'
        setSlotsError(message)
        setSlots([])
        setSlotsEmptyReason(undefined)
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedDate, service.id, slug])

  const dateItems = useMemo(
    () =>
      dates.map((ymd) => {
        const { jm, jd } = parseGregorianToJalali(ymd)
        const dow = dayOfWeekIranian(ymd)
        return {
          ymd,
          weekday: PERSIAN_WEEKDAYS_SHORT[dow]!,
          day: toPersianDigits(jd),
          month: JALALI_MONTHS[jm - 1]!,
        }
      }),
    [dates],
  )

  const canSubmit =
    !!selectedStart && customerName.trim().length > 0 && customerPhone.trim().length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedStart) {
      setFormError('لطفاً یک زمان را انتخاب کنید.')
      return
    }
    setFormError(null)
    const endTime = addMinutesToHm(selectedStart, service.duration)
    startSubmit(async () => {
      try {
        const { token } = await submitAppointmentRequest(slug, {
          serviceId: service.id,
          date: selectedDate,
          startTime: selectedStart,
          endTime,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          notes: notes.trim() ? notes.trim() : undefined,
        })
        router.push(`/salons/${slug}/requests/${token}`)
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'ثبت درخواست با خطا مواجه شد. لطفاً دوباره تلاش کنید.'
        setFormError(message)
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 sm:px-8">
      <div className="rounded-2xl border border-[#f3d5dd] bg-white/85 p-4 text-sm text-[#6b4955]">
        <p className="font-extrabold text-[#3f2730]">{service.name}</p>
        <p className="mt-1 text-xs">
          {formatDuration(service.duration)} · {formatPrice(service.price)}
        </p>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-extrabold text-[#7a2a40]">انتخاب روز</h2>
        <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {dateItems.map((item) => {
            const active = item.ymd === selectedDate
            return (
              <button
                key={item.ymd}
                type="button"
                onClick={() => setSelectedDate(item.ymd)}
                className={`flex min-w-16 flex-col items-center rounded-xl border px-3 py-2 text-center transition ${
                  active
                    ? 'border-transparent text-white shadow-[0_8px_20px_rgba(124,28,48,0.22)]'
                    : 'border-[#f3d5dd] bg-white text-[#3f2730] hover:border-[#e8a8ba]'
                }`}
                style={active ? { backgroundColor: 'var(--salon-accent)' } : undefined}
              >
                <span className="text-[10px] opacity-80">{item.weekday}</span>
                <span className="mt-1 text-lg font-extrabold leading-none">
                  {item.day}
                </span>
                <span className="mt-1 text-[10px] opacity-80">{item.month}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-extrabold text-[#7a2a40]">انتخاب زمان</h2>
        {slotsLoading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-[#f3d5dd] bg-white/85 p-4 text-sm text-[#6b4955]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            در حال بارگذاری زمان‌های موجود…
          </div>
        ) : slotsError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {slotsError}
          </p>
        ) : slots.length === 0 ? (
          <p className="rounded-2xl border border-[#f3d5dd] bg-white/85 p-4 text-sm text-[#6b4955]">
            {emptyReasonMessage(slotsEmptyReason)}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => {
              const active = slot.startTime === selectedStart
              return (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => setSelectedStart(slot.startTime)}
                  className={`rounded-xl border px-3 py-2 text-center text-sm font-bold transition ${
                    active
                      ? 'border-transparent text-white shadow-[0_8px_20px_rgba(124,28,48,0.22)]'
                      : 'border-[#f3d5dd] bg-white text-[#3f2730] hover:border-[#e8a8ba]'
                  }`}
                  style={
                    active ? { backgroundColor: 'var(--salon-accent)' } : undefined
                  }
                  dir="ltr"
                >
                  {formatHm(slot.startTime)}
                </button>
              )
            })}
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <h2 className="text-sm font-extrabold text-[#7a2a40]">اطلاعات شما</h2>

        <label className="block">
          <span className="text-xs font-bold text-[#6b4955]">نام و نام خانوادگی</span>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-[#f3d5dd] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#e8a8ba]"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-[#6b4955]">شماره موبایل</span>
          <input
            type="tel"
            inputMode="numeric"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
            placeholder="09xxxxxxxxx"
            className="mt-1 block w-full rounded-xl border border-[#f3d5dd] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#e8a8ba]"
            dir="ltr"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-[#6b4955]">یادداشت (اختیاری)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-xl border border-[#f3d5dd] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#e8a8ba]"
          />
        </label>

        {formError ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-extrabold text-white shadow-[0_18px_40px_rgba(124,28,48,0.28)] transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          style={{ backgroundColor: 'var(--salon-accent)' }}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          ارسال درخواست رزرو
        </button>
      </form>
    </div>
  )
}
