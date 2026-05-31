import { formatJalaliFullDate } from '@repo/salon-core/jalali'
import type { MessagingButton } from '../providers/types'

export type AppointmentRequestTemplateInput = {
  requestId: string
  salonName: string
  customerName: string
  customerPhone: string
  serviceName: string
  /** Gregorian date string `YYYY-MM-DD`. */
  date: string
  /** `HH:MM`. */
  startTime: string
  /** Absolute URL to the request in the manager PWA. */
  deepLinkUrl: string
}

export type AppointmentRequestTemplate = {
  title: string
  body: string
  data: Record<string, unknown>
  buttons?: MessagingButton[][]
}

/**
 * Phase 1 v1: link + notify — deep-link button to the manager PWA; inline approve deferred.
 */
export function renderAppointmentRequestPending(
  input: AppointmentRequestTemplateInput
): AppointmentRequestTemplate {
  const date = formatJalaliFullDate(input.date)
  const title = `درخواست رزرو جدید — ${input.salonName}`
  const body = [
    input.customerName,
    `📞 ${input.customerPhone}`,
    `✂️ ${input.serviceName}`,
    `📅 ${date} ساعت ${input.startTime}`,
  ].join('\n')

  const buttons: MessagingButton[][] | undefined = input.deepLinkUrl.startsWith('http')
    ? [[{ label: 'مشاهده در برنامه', url: input.deepLinkUrl }]]
    : undefined

  return {
    title,
    body,
    data: {
      requestId: input.requestId,
      deepLinkUrl: input.deepLinkUrl,
    },
    ...(buttons ? { buttons } : {}),
  }
}
