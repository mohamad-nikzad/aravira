import type { MessagingProviderId } from '@repo/database/messaging'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export type { MessagingProviderId }

export type MessagingAccount = {
  id: string
  provider: MessagingProviderId
  displayName: string | null
  enabled: boolean
  linkedAt: string
}

export type MessagingProviderSummary = {
  id: MessagingProviderId
  displayName: string
}

export type ListMessagingAccountsResponse = {
  providers: MessagingProviderSummary[]
  accounts: MessagingAccount[]
}

export type CreateMessagingLinkResponse = {
  deepLink: string
  expiresAt: string
}

export type MessagingAccountResponse = {
  account: MessagingAccount
}

export function createMessagingApi(client: ApiClient) {
  return {
    listAccounts(opts: { signal?: AbortSignal } = {}) {
      return client.request<ListMessagingAccountsResponse>(
        `${endpoints.messaging}/accounts`,
        { signal: opts.signal }
      )
    },
    createLink(
      input: { provider: MessagingProviderId },
      opts: { signal?: AbortSignal } = {}
    ) {
      return client.request<CreateMessagingLinkResponse>(
        `${endpoints.messaging}/link`,
        { method: 'POST', body: input, signal: opts.signal }
      )
    },
    setEnabled(
      id: string,
      enabled: boolean,
      opts: { signal?: AbortSignal } = {}
    ) {
      return client.request<MessagingAccountResponse>(
        `${endpoints.messaging}/accounts/${id}`,
        { method: 'PATCH', body: { enabled }, signal: opts.signal }
      )
    },
    unlink(id: string, opts: { signal?: AbortSignal } = {}) {
      return client.request<{ ok: true }>(
        `${endpoints.messaging}/accounts/${id}`,
        { method: 'DELETE', signal: opts.signal }
      )
    },
  }
}

export type MessagingApi = ReturnType<typeof createMessagingApi>
