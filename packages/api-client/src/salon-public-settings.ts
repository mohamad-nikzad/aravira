import type { Service } from '@repo/salon-core/types'
import type { PublicSettingsInput } from '@repo/salon-core/forms/public'
import type { SlugUpdateInput } from '@repo/salon-core/forms/slug'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type ManagerPublicSettingsView = {
  enabled: boolean
  bioText: string | null
  themeId: string
  layoutId: string
  appointmentRequestsEnabled: boolean
}

export type ManagerServiceVisibilityView = {
  service: Service
  visible: boolean
}

export type ManagerPublicSettingsResult = {
  slug: string
  salonName: string
  settings: ManagerPublicSettingsView
  services: ManagerServiceVisibilityView[]
}

export type SalonPublicSettingsResponse = ManagerPublicSettingsResult
export type UpdateSalonPublicSettingsInput = PublicSettingsInput

export function createSalonPublicSettingsApi(client: ApiClient) {
  return {
    get(opts: { signal?: AbortSignal } = {}) {
      return client.request<SalonPublicSettingsResponse>(
        endpoints.salonPublicSettings,
        { signal: opts.signal },
      )
    },
    update(
      input: UpdateSalonPublicSettingsInput,
      opts: { signal?: AbortSignal } = {},
    ) {
      return client.request<SalonPublicSettingsResponse>(
        endpoints.salonPublicSettings,
        {
          method: 'PUT',
          body: input,
          signal: opts.signal,
        },
      )
    },
    updateSlug(input: SlugUpdateInput, opts: { signal?: AbortSignal } = {}) {
      return client.request<SalonPublicSettingsResponse>(
        `${endpoints.salonPublicSettings}/slug`,
        {
          method: 'PATCH',
          body: input,
          signal: opts.signal,
        },
      )
    },
  }
}

export type SalonPublicSettingsApi = ReturnType<typeof createSalonPublicSettingsApi>
