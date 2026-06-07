import type { BusinessHours, StaffSchedule, User } from '@repo/salon-core/types'
import type {
  StaffCreateRequestPayload,
  StaffPasswordRequestPayload,
  StaffScheduleRequestPayload,
  StaffServiceIdsPayload,
  StaffUpdateFormPayload,
} from '@repo/salon-core/forms/staff'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type StaffResponse = {
  staff: User[]
}

export type CreateStaffInput = StaffCreateRequestPayload

export type CreateStaffResponse = {
  user: User
}

export type UpdateStaffServicesInput = StaffServiceIdsPayload
export type UpdateStaffInput = StaffUpdateFormPayload
export type UpdateStaffPasswordInput = StaffPasswordRequestPayload

export type StaffMemberResponse = {
  staff: User
}

export type StaffScheduleResponse = {
  schedule: StaffSchedule[]
  businessHours: BusinessHours
}

export type UpdateStaffScheduleInput = StaffScheduleRequestPayload

export function createStaffApi(client: ApiClient) {
  return {
    list(opts: { signal?: AbortSignal } = {}) {
      return client.request<StaffResponse>(endpoints.staff, {
        signal: opts.signal,
      })
    },
    create(input: CreateStaffInput, opts: { signal?: AbortSignal } = {}) {
      return client.request<CreateStaffResponse>(endpoints.staff, {
        method: 'POST',
        body: input,
        signal: opts.signal,
      })
    },
    update(
      id: string,
      input: UpdateStaffInput,
      opts: { signal?: AbortSignal } = {},
    ) {
      return client.request<StaffMemberResponse>(`${endpoints.staff}/${id}`, {
        method: 'PATCH',
        body: input,
        signal: opts.signal,
      })
    },
    updatePassword(
      id: string,
      input: UpdateStaffPasswordInput,
      opts: { signal?: AbortSignal } = {},
    ) {
      return client.request<{ success: true }>(
        `${endpoints.staff}/${id}/password`,
        {
          method: 'PATCH',
          body: input,
          signal: opts.signal,
        },
      )
    },
    delete(id: string, opts: { signal?: AbortSignal } = {}) {
      return client.request<{ success: true }>(`${endpoints.staff}/${id}`, {
        method: 'DELETE',
        signal: opts.signal,
      })
    },
    updateServices(
      id: string,
      input: UpdateStaffServicesInput,
      opts: { signal?: AbortSignal } = {},
    ) {
      return client.request<StaffMemberResponse>(
        `${endpoints.staff}/${id}/services`,
        {
          method: 'PATCH',
          body: input,
          signal: opts.signal,
        },
      )
    },
    getSchedule(id: string, opts: { signal?: AbortSignal } = {}) {
      return client.request<StaffScheduleResponse>(
        `${endpoints.staff}/${id}/schedule`,
        {
          signal: opts.signal,
        },
      )
    },
    updateSchedule(
      id: string,
      input: UpdateStaffScheduleInput,
      opts: { signal?: AbortSignal } = {},
    ) {
      return client.request<Pick<StaffScheduleResponse, 'schedule'>>(
        `${endpoints.staff}/${id}/schedule`,
        {
          method: 'PUT',
          body: input,
          signal: opts.signal,
        },
      )
    },
    bookingAvailability(
      input: { date: string; startTime: string; endTime: string },
      opts: { signal?: AbortSignal } = {},
    ) {
      const params = new URLSearchParams(input)
      return client.request<StaffResponse>(
        `${endpoints.staff}/booking-availability?${params.toString()}`,
        { signal: opts.signal },
      )
    },
  }
}

export type StaffApi = ReturnType<typeof createStaffApi>
