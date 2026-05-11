import type { Client } from '@repo/salon-core/types'
import type { ClientCreatePayload } from '@repo/salon-core/forms/client'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type ClientsResponse = {
  clients: Client[]
}

export type CreateClientInput = ClientCreatePayload

export type CreateClientResponse = {
  client: Client
}

export function createClientsApi(client: ApiClient) {
  return {
    list(opts: { signal?: AbortSignal } = {}) {
      return client.request<ClientsResponse>(endpoints.clients, { signal: opts.signal })
    },
    create(input: CreateClientInput, opts: { signal?: AbortSignal } = {}) {
      return client.request<CreateClientResponse>(endpoints.clients, {
        method: 'POST',
        body: input,
        signal: opts.signal,
      })
    },
  }
}

export type ClientsApi = ReturnType<typeof createClientsApi>
