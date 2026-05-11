import type { Service } from '@repo/salon-core/types'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type ServicesResponse = {
  services: Service[]
}

export function createServicesApi(client: ApiClient) {
  return {
    list(opts: { includeInactive?: boolean; signal?: AbortSignal } = {}) {
      const path = opts.includeInactive ? `${endpoints.services}?all=1` : endpoints.services
      return client.request<ServicesResponse>(path, { signal: opts.signal })
    },
  }
}

export type ServicesApi = ReturnType<typeof createServicesApi>
