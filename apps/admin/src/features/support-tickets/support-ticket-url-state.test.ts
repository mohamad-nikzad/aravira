import { describe, expect, it } from 'vitest'

import {
  compactSupportTicketSearch,
  supportTicketListParams,
  supportTicketSearchSchema,
} from './support-ticket-url-state'

describe('Support Ticket URL state', () => {
  it('defaults to the unresolved inbox at page one', () => {
    expect(supportTicketSearchSchema.parse({})).toEqual({
      page: 1,
      scope: 'unresolved',
    })
    expect(
      compactSupportTicketSearch({ page: 1, scope: 'unresolved' }),
    ).toEqual({})
  })

  it('serializes all shareable filters and maps salon to the API query', () => {
    const state = supportTicketSearchSchema.parse({
      page: '3',
      search: '  رزرو  ',
      status: 'waiting_for_manager',
      category: 'question',
      salon: 'salon-1',
      scope: 'all',
    })

    expect(compactSupportTicketSearch(state)).toEqual({
      page: 3,
      search: 'رزرو',
      status: 'waiting_for_manager',
      category: 'question',
      salon: 'salon-1',
      scope: 'all',
    })
    expect(supportTicketListParams(state)).toEqual({
      page: 3,
      pageSize: 20,
      search: 'رزرو',
      status: 'waiting_for_manager',
      category: 'question',
      salonId: 'salon-1',
      scope: 'all',
    })
  })
})
