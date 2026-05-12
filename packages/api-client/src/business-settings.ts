import type { BusinessHours } from '@repo/salon-core/types'
import type { BusinessSettingsPayload } from '@repo/salon-core/forms/settings'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type BusinessSettingsResponse = {
  settings: BusinessHours
}

export type UpdateBusinessSettingsInput = BusinessSettingsPayload

export function createBusinessSettingsApi(client: ApiClient) {
  return {
    get(opts: { signal?: AbortSignal } = {}) {
      return client.request<BusinessSettingsResponse>(endpoints.businessSettings, {
        signal: opts.signal,
      })
    },
    update(input: UpdateBusinessSettingsInput, opts: { signal?: AbortSignal } = {}) {
      return client.request<BusinessSettingsResponse>(endpoints.businessSettings, {
        method: 'PATCH',
        body: input,
        signal: opts.signal,
      })
    },
  }
}

export type BusinessSettingsApi = ReturnType<typeof createBusinessSettingsApi>
