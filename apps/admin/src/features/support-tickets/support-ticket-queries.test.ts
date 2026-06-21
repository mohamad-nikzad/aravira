import {
  getAdminSupportTicketSummaryOptions,
  getAdminSupportTicketSummaryQueryKey,
} from '@repo/api-client/query'
import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import {
  adminSupportTicketInboxOptions,
  adminSupportTicketSummaryOptions,
  SUPPORT_TICKET_SUMMARY_POLL_MS,
  invalidateAdminSupportTicketQueries,
  supportTicketInvalidationKeys,
} from './support-ticket-queries'

describe('admin Support Ticket queries', () => {
  it('uses URL state in the generated inbox query key', () => {
    const options = adminSupportTicketInboxOptions({
      page: 2,
      scope: 'unresolved',
      search: 'Aftab',
      category: 'problem',
      salon: 'salon-1',
    })

    expect(options.queryKey[0]).toMatchObject({
      query: {
        page: 2,
        pageSize: 20,
        scope: 'unresolved',
        search: 'Aftab',
        category: 'problem',
        salonId: 'salon-1',
      },
    })
  })

  it('polls the focused summary every sixty seconds only', () => {
    const options = adminSupportTicketSummaryOptions()
    expect(options).toMatchObject({
      enabled: true,
      refetchInterval: SUPPORT_TICKET_SUMMARY_POLL_MS,
      refetchIntervalInBackground: false,
    })
    expect(options.queryKey).toEqual(
      getAdminSupportTicketSummaryOptions().queryKey,
    )
  })

  it('provides independent detail, inbox, summary, and audit keys', () => {
    const keys = supportTicketInvalidationKeys('ticket-1')

    expect(keys.detail[0]).toMatchObject({ _id: 'getAdminSupportTicket' })
    expect(keys.inbox[0]).toMatchObject({ _id: 'listAdminSupportTickets' })
    expect(keys.summary[0]).toMatchObject({
      _id: 'getAdminSupportTicketSummary',
    })
    expect(keys.audit[0]).toMatchObject({ _id: 'getApiV1AdminAuditLog' })
  })

  it('invalidates the exact generated header summary cache after mutations', async () => {
    const queryClient = new QueryClient()
    const headerKey = getAdminSupportTicketSummaryOptions().queryKey
    queryClient.setQueryData(headerKey, { unresolvedCount: 4, unreadCount: 1 })

    await invalidateAdminSupportTicketQueries(queryClient, 'ticket-1', true)

    expect(supportTicketInvalidationKeys('ticket-1').summary).toEqual(
      getAdminSupportTicketSummaryQueryKey(),
    )
    expect(queryClient.getQueryState(headerKey)?.isInvalidated).toBe(true)
  })
})
