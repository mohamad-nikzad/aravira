import { useState } from 'react'
import type { AppointmentWithDetails } from '@repo/salon-core/types'

import { api } from '#/lib/api-client'
import type { StatusActionFeedback } from '#/components/today/staff-today-context'
import { useManagerWriteMutation } from '#/lib/use-manager-mutation'

export function useStaffTodayStatusMutation(onAfterSuccess: () => void) {
  const [statusFeedback, setStatusFeedback] =
    useState<StatusActionFeedback>(null)

  const updateAppointmentStatus = useManagerWriteMutation(
    'staffToday.appointment.updateStatus',
    {
      apiFn: ({
        appointmentId,
        status,
      }: {
        appointmentId: string
        status: AppointmentWithDetails['status']
      }) => api.appointments.updateStatus(appointmentId, status),
      meta: { skipSuccessToast: true, skipErrorToast: true },
    },
  )

  const patchStatus = async (
    appointmentId: string,
    status: AppointmentWithDetails['status'],
  ) => {
    setStatusFeedback({
      appointmentId,
      status,
      mode: 'saving',
      message: 'در حال ثبت وضعیت...',
    })
    try {
      const payload = await updateAppointmentStatus.mutateAsync({
        appointmentId,
        status,
      })
      setStatusFeedback({
        appointmentId,
        status,
        mode: 'saved',
        message:
          'removedAppointmentId' in payload && payload.removedAppointmentId
            ? 'رزرو موقت لغو و حذف شد.'
            : 'وضعیت ثبت شد.',
      })
      onAfterSuccess()
    } catch (err) {
      setStatusFeedback({
        appointmentId,
        status,
        mode: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'خطایی رخ داد. دوباره تلاش کنید.',
      })
    }
  }

  return { statusFeedback, patchStatus }
}
