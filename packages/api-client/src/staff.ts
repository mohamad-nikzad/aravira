import type { User } from '@repo/salon-core/types'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type StaffResponse = {
  staff: User[]
}

export function createStaffApi(client: ApiClient) {
  return {
    list(opts: { signal?: AbortSignal } = {}) {
      return client.request<StaffResponse>(endpoints.staff, { signal: opts.signal })
    },
  }
}

export type StaffApi = ReturnType<typeof createStaffApi>
