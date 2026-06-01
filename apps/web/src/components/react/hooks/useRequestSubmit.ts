'use client'

import { useState, useTransition } from 'react'
import { submitAppointmentRequest } from '@/lib/public-api'

export function addMinutesToHm(hm: string, minutes: number): string {
  const [h, m] = hm.split(':').map(Number)
  const total = h! * 60 + m! + minutes
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export type SubmitArgs = {
  serviceId: string
  duration: number
  date: string
  startTime: string
  customerName: string
  customerPhone: string
  notes?: string
}

export function useRequestSubmit(slug: string) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, startSubmit] = useTransition()

  function submit(args: SubmitArgs) {
    setError(null)
    const endTime = addMinutesToHm(args.startTime, args.duration)
    startSubmit(async () => {
      try {
        const { token } = await submitAppointmentRequest(slug, {
          serviceId: args.serviceId,
          date: args.date,
          startTime: args.startTime,
          endTime,
          customerName: args.customerName.trim(),
          customerPhone: args.customerPhone.trim(),
          notes: args.notes?.trim() ? args.notes.trim() : undefined,
        })
        window.location.assign(`/salons/${slug}/requests/${token}`)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'ثبت درخواست با خطا مواجه شد. لطفاً دوباره تلاش کنید.',
        )
      }
    })
  }

  return { submit, isSubmitting, error, setError }
}
