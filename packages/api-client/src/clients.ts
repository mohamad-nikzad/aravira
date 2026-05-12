import type { Client, ClientFollowUp, ClientSummary, FollowUpReason } from '@repo/salon-core/types'
import type { ClientCreatePayload, ClientUpdatePayload } from '@repo/salon-core/forms/client'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type ClientsResponse = {
  clients: Client[]
}

export type CreateClientInput = ClientCreatePayload

export type CreateClientResponse = {
  client: Client
}

export type UpdateClientInput = ClientUpdatePayload

export type ClientResponse = {
  client: Client
}

export type CreateClientFollowUpInput = {
  reason?: FollowUpReason
  dueDate?: string
}

export type CreateClientFollowUpResponse = {
  followUp: ClientFollowUp
}

export function createClientsApi(client: ApiClient) {
  return {
    list(opts: { signal?: AbortSignal } = {}) {
      return client.request<ClientsResponse>(endpoints.clients, { signal: opts.signal })
    },
    get(id: string, opts: { signal?: AbortSignal } = {}) {
      return client.request<ClientResponse>(`${endpoints.clients}/${id}`, {
        signal: opts.signal,
      })
    },
    create(input: CreateClientInput, opts: { signal?: AbortSignal } = {}) {
      return client.request<CreateClientResponse>(endpoints.clients, {
        method: 'POST',
        body: input,
        signal: opts.signal,
      })
    },
    update(id: string, input: UpdateClientInput, opts: { signal?: AbortSignal } = {}) {
      return client.request<ClientResponse>(`${endpoints.clients}/${id}`, {
        method: 'PATCH',
        body: input,
        signal: opts.signal,
      })
    },
    summary(id: string, opts: { signal?: AbortSignal } = {}) {
      return client.request<ClientSummary>(`${endpoints.clients}/${id}/summary`, {
        signal: opts.signal,
      })
    },
    createFollowUp(
      id: string,
      input: CreateClientFollowUpInput = {},
      opts: { signal?: AbortSignal } = {},
    ) {
      return client.request<CreateClientFollowUpResponse>(
        `${endpoints.clients}/${id}/follow-ups`,
        {
          method: 'POST',
          body: input,
          signal: opts.signal,
        },
      )
    },
  }
}

export type ClientsApi = ReturnType<typeof createClientsApi>
