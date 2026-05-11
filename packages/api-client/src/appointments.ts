import type { AppointmentWithDetails } from '@repo/salon-core/types'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type AppointmentsRangeResponse = {
  appointments: AppointmentWithDetails[]
}

export type CreateAppointmentInput = {
  clientId?: string
  placeholderClient?: { name: string; notes?: string }
  staffId: string
  serviceId: string
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
  notes?: string
}

export type CreateAppointmentResponse = {
  appointment: AppointmentWithDetails
}

export function createAppointmentsApi(client: ApiClient) {
  return {
    listRange(
      input: { startDate: string; endDate: string },
      opts: { signal?: AbortSignal } = {},
    ) {
      const params = new URLSearchParams({
        startDate: input.startDate,
        endDate: input.endDate,
      })
      return client.request<AppointmentsRangeResponse>(
        `${endpoints.appointments}?${params.toString()}`,
        { signal: opts.signal },
      )
    },
    create(input: CreateAppointmentInput, opts: { signal?: AbortSignal } = {}) {
      return client.request<CreateAppointmentResponse>(endpoints.appointments, {
        method: 'POST',
        body: input,
        signal: opts.signal,
      })
    },
    updateStatus(
      id: string,
      status: AppointmentWithDetails['status'],
      opts: { signal?: AbortSignal } = {},
    ) {
      return client.request<UpdateAppointmentStatusResponse>(
        `${endpoints.appointments}/${id}`,
        {
          method: 'PATCH',
          body: { status },
          signal: opts.signal,
        },
      )
    },
  }
}

export type UpdateAppointmentStatusResponse =
  | { appointment: AppointmentWithDetails; removedAppointmentId?: undefined }
  | { removedAppointmentId: string; appointment?: undefined }

export type AppointmentsApi = ReturnType<typeof createAppointmentsApi>
