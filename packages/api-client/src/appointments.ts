import type { AppointmentWithDetails } from '@repo/salon-core/types'
import type { AvailabilityMode, AvailabilityResponse } from '@repo/salon-core/availability'
import type {
  AppointmentCreatePayload,
  AppointmentUpdatePayload,
  CompletePlaceholderClientPayload,
} from '@repo/salon-core/forms/appointment'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type AppointmentsRangeResponse = {
  appointments: AppointmentWithDetails[]
}

export type CreateAppointmentInput = AppointmentCreatePayload

export type CreateAppointmentResponse = {
  appointment: AppointmentWithDetails
}

export type AppointmentResponse = {
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
    get(id: string, opts: { signal?: AbortSignal } = {}) {
      return client.request<AppointmentResponse>(`${endpoints.appointments}/${id}`, {
        signal: opts.signal,
      })
    },
    update(
      id: string,
      input: UpdateAppointmentInput,
      opts: { signal?: AbortSignal } = {},
    ) {
      return client.request<UpdateAppointmentResponse>(
        `${endpoints.appointments}/${id}`,
        {
          method: 'PATCH',
          body: input,
          signal: opts.signal,
        },
      )
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
    delete(id: string, opts: { signal?: AbortSignal } = {}) {
      return client.request<DeleteAppointmentResponse>(
        `${endpoints.appointments}/${id}`,
        {
          method: 'DELETE',
          signal: opts.signal,
        },
      )
    },
    availability(
      input: AppointmentAvailabilityInput,
      opts: { signal?: AbortSignal } = {},
    ) {
      const params = new URLSearchParams({
        mode: input.mode,
        serviceId: input.serviceId,
        date: input.date,
        ...(input.staffId ? { staffId: input.staffId } : {}),
      })
      return client.request<AvailabilityResponse>(
        `${endpoints.appointmentsAvailability}?${params.toString()}`,
        { signal: opts.signal },
      )
    },
    completePlaceholderClient(
      id: string,
      input: CompletePlaceholderClientInput,
      opts: { signal?: AbortSignal } = {},
    ) {
      return client.request<CompletePlaceholderClientResponse>(
        `${endpoints.appointments}/${id}/complete-client`,
        {
          method: 'POST',
          body: input,
          signal: opts.signal,
        },
      )
    },
  }
}

export type UpdateAppointmentInput = AppointmentUpdatePayload

export type UpdateAppointmentResponse =
  | { appointment: AppointmentWithDetails; removedAppointmentId?: undefined }
  | {
      success: true
      removedAppointmentId: string
      cleanup: true
      appointment?: undefined
    }

export type UpdateAppointmentStatusResponse = UpdateAppointmentResponse

export type DeleteAppointmentResponse = {
  success: boolean
}

export type AppointmentAvailabilityInput = {
  mode: AvailabilityMode
  serviceId: string
  date: string
  staffId?: string
}

export type CompletePlaceholderClientInput = CompletePlaceholderClientPayload

export type CompletePlaceholderClientResponse = {
  appointment: AppointmentWithDetails
  outcome: 'created-client' | 'reassigned-client'
}

export type AppointmentsApi = ReturnType<typeof createAppointmentsApi>
