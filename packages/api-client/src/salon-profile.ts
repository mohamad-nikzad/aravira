import type { PresencePayload } from '@repo/salon-core/forms/presence'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type SalonPresenceView = {
  address: string | null
  mapGoogle: string | null
  mapNeshan: string | null
  mapBalad: string | null
  socialInstagram: string | null
  socialTelegram: string | null
  socialWhatsapp: string | null
  website: string | null
}

export type SalonPresenceResponse = {
  presence: SalonPresenceView
}

export type UpdateSalonPresenceInput = PresencePayload

export function createSalonProfileApi(client: ApiClient) {
  return {
    getPresence(opts: { signal?: AbortSignal } = {}) {
      return client.request<SalonPresenceResponse>(
        `${endpoints.salonProfile}/presence`,
        { signal: opts.signal },
      )
    },
    updatePresence(
      input: UpdateSalonPresenceInput,
      opts: { signal?: AbortSignal } = {},
    ) {
      return client.request<SalonPresenceResponse>(
        `${endpoints.salonProfile}/presence`,
        {
          method: 'PATCH',
          body: input,
          signal: opts.signal,
        },
      )
    },
  }
}

export type SalonProfileApi = ReturnType<typeof createSalonProfileApi>
