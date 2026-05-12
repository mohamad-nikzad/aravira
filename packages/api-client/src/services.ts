import type { Service } from '@repo/salon-core/types'
import type { ServiceCreatePayload, ServiceUpdatePayload } from '@repo/salon-core/forms/service'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type ServicesResponse = {
  services: Service[]
}

export type ServiceResponse = {
  service: Service
}

export type CreateServiceInput = ServiceCreatePayload
export type UpdateServiceInput = ServiceUpdatePayload

export function createServicesApi(client: ApiClient) {
  return {
    list(opts: { includeInactive?: boolean; signal?: AbortSignal } = {}) {
      const path = opts.includeInactive ? `${endpoints.services}?all=1` : endpoints.services
      return client.request<ServicesResponse>(path, { signal: opts.signal })
    },
    get(id: string, opts: { signal?: AbortSignal } = {}) {
      return client.request<ServiceResponse>(`${endpoints.services}/${id}`, {
        signal: opts.signal,
      })
    },
    create(input: CreateServiceInput, opts: { signal?: AbortSignal } = {}) {
      return client.request<ServiceResponse>(endpoints.services, {
        method: 'POST',
        body: input,
        signal: opts.signal,
      })
    },
    update(id: string, input: UpdateServiceInput, opts: { signal?: AbortSignal } = {}) {
      return client.request<ServiceResponse>(`${endpoints.services}/${id}`, {
        method: 'PATCH',
        body: input,
        signal: opts.signal,
      })
    },
  }
}

export type ServicesApi = ReturnType<typeof createServicesApi>
