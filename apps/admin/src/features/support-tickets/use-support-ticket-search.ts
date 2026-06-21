import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'

import {
  compactSupportTicketSearch,
  type SupportTicketUrlState,
} from './support-ticket-url-state'

export function useSupportTicketSearch() {
  const search = useSearch({ from: '/_admin/support-tickets/' })
  const navigate = useNavigate({ from: '/support-tickets' })

  const setSearch = useCallback(
    (next: Partial<SupportTicketUrlState>, options?: { replace?: boolean }) =>
      navigate({
        replace: options?.replace ?? false,
        search: (previous) =>
          compactSupportTicketSearch({ ...previous, ...next }),
      }),
    [navigate],
  )

  return [search, setSearch] as const
}
