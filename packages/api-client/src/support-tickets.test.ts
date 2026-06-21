import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureGeneratedApiClient } from './client'
import {
  getAdminSupportTicket,
  getManagerSupportTicket,
  listAdminSupportTickets,
  listManagerSupportTickets,
} from './generated/sdk.gen'
import type {
  AdminSupportTicketMutationTicket,
  AdminSupportMessage,
  ListAdminSupportTicketsData,
  ManagerSupportTicket,
  ManagerSupportTicketMutationResponse,
  ManagerSupportMessage,
} from './generated/types.gen'

type ManagerPlatformMessage = Extract<
  ManagerSupportMessage,
  { authorKind: 'platform' }
>

const managerPlatformMessage: ManagerPlatformMessage = {
  id: 'message-1',
  authorKind: 'platform',
  authorDisplayName: 'پشتیبانی سالونا',
  body: 'answer',
  createdAt: '2026-06-21T00:00:00.000Z',
}

function acceptsManagerPlatformKey(_key: keyof ManagerPlatformMessage) {}

// @ts-expect-error Manager platform messages must never expose the real author ID.
acceptsManagerPlatformKey('authorUserId')

const createPreviousStatus: ManagerSupportTicketMutationResponse['previousStatus'] =
  null
const managerResolvedAt: ManagerSupportTicket['resolvedAt'] = null
const adminCursorDate: AdminSupportTicketMutationTicket['platformLastReadAt'] =
  null

function acceptsPreviousStatus(
  _value: ManagerSupportTicketMutationResponse['previousStatus'],
) {}
function acceptsNullableDate(
  _value: AdminSupportTicketMutationTicket['resolvedAt'],
) {}

// @ts-expect-error Nullable status is a precise enum union, not unknown.
acceptsPreviousStatus({})
// @ts-expect-error Nullable date is string | null, not unknown.
acceptsNullableDate(123)

const adminMessage: AdminSupportMessage = {
  id: 'message-1',
  authorKind: 'platform',
  authorUserId: 'platform-user-1',
  authorDisplayName: 'Real Platform User',
  body: 'answer',
  createdAt: '2026-06-21T00:00:00.000Z',
}

const adminQuery: NonNullable<ListAdminSupportTicketsData['query']> = {
  page: 2,
  pageSize: 50,
  status: 'waiting_for_manager',
  category: 'feature_request',
  salonId: '00000000-0000-4000-8000-000000000001',
  search: 'salon',
  scope: 'all',
}

describe('generated Support Ticket client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps manager and admin operation paths distinct', async () => {
    const urls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request =
          input instanceof Request ? input : new Request(input, init)
        urls.push(request.url)
        return new Response('{}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }),
    )
    configureGeneratedApiClient({ baseUrl: 'https://example.test' })

    await getManagerSupportTicket({ path: { ticketId: 'manager-ticket' } })
    await getAdminSupportTicket({ path: { ticketId: 'admin-ticket' } })

    expect(urls).toEqual([
      'https://example.test/api/v1/support-tickets/manager-ticket',
      'https://example.test/api/v1/admin/support-tickets/admin-ticket',
    ])
  })

  it('serializes manager pagination and every admin inbox filter', async () => {
    const urls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request =
          input instanceof Request ? input : new Request(input, init)
        urls.push(request.url)
        return new Response(
          '{"items":[],"pagination":{"page":1,"pageSize":25,"total":0}}',
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }),
    )
    configureGeneratedApiClient({ baseUrl: 'https://example.test' })

    await listManagerSupportTickets({ query: { page: 3, pageSize: 10 } })
    await listAdminSupportTickets({ query: adminQuery })

    expect(new URL(urls[0]!).searchParams).toEqual(
      new URLSearchParams({ page: '3', pageSize: '10' }),
    )
    expect(Object.fromEntries(new URL(urls[1]!).searchParams)).toEqual({
      page: '2',
      pageSize: '50',
      status: 'waiting_for_manager',
      category: 'feature_request',
      salonId: '00000000-0000-4000-8000-000000000001',
      search: 'salon',
      scope: 'all',
    })
  })

  it('redacts manager platform identity while retaining admin identity', () => {
    expect(managerPlatformMessage).toEqual({
      id: 'message-1',
      authorKind: 'platform',
      authorDisplayName: 'پشتیبانی سالونا',
      body: 'answer',
      createdAt: '2026-06-21T00:00:00.000Z',
    })
    expect(adminMessage.authorUserId).toBe('platform-user-1')
    expect(adminMessage.authorDisplayName).toBe('Real Platform User')
  })

  it('keeps nullable lifecycle and date fields precise', () => {
    expect(createPreviousStatus).toBeNull()
    expect(managerResolvedAt).toBeNull()
    expect(adminCursorDate).toBeNull()
  })
})
