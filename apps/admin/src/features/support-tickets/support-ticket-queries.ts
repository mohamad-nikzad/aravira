import {
  createAdminSupportMessageMutation,
  getAdminSupportTicketOptions,
  getAdminSupportTicketQueryKey,
  getAdminSupportTicketSummaryQueryKey,
  getApiV1AdminAuditLogQueryKey,
  listAdminSupportTicketsOptions,
  listAdminSupportTicketsQueryKey,
  markAdminSupportTicketReadMutation,
  resolveAdminSupportTicketMutation,
} from '@repo/api-client/query'
import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'

import {
  supportTicketListParams,
  type SupportTicketUrlState,
} from './support-ticket-url-state'

export {
  adminSupportTicketSummaryOptions,
  SUPPORT_TICKET_SUMMARY_POLL_MS,
} from './support-ticket-summary-query'

export function adminSupportTicketInboxOptions(state: SupportTicketUrlState) {
  return listAdminSupportTicketsOptions({
    query: supportTicketListParams(state),
  })
}

export function adminSupportTicketDetailOptions(ticketId: string) {
  return getAdminSupportTicketOptions({ path: { ticketId } })
}

export function supportTicketInvalidationKeys(ticketId: string) {
  return {
    detail: getAdminSupportTicketQueryKey({ path: { ticketId } }),
    inbox: listAdminSupportTicketsQueryKey(),
    summary: getAdminSupportTicketSummaryQueryKey(),
    audit: getApiV1AdminAuditLogQueryKey(),
  }
}

export async function invalidateAdminSupportTicketQueries(
  queryClient: QueryClient,
  ticketId: string,
  includeAudit: boolean,
) {
  const keys = supportTicketInvalidationKeys(ticketId)
  const invalidations = [
    queryClient.invalidateQueries({ queryKey: keys.detail }),
    queryClient.invalidateQueries({ queryKey: keys.inbox }),
    queryClient.invalidateQueries({ queryKey: keys.summary }),
  ]
  if (includeAudit) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: keys.audit }))
  }
  await Promise.all(invalidations)
}

function useInvalidateSupportTicket(ticketId: string, includeAudit: boolean) {
  const queryClient = useQueryClient()
  return () =>
    invalidateAdminSupportTicketQueries(queryClient, ticketId, includeAudit)
}

export function useMarkAdminSupportTicketRead(ticketId: string) {
  return useMutation({
    ...markAdminSupportTicketReadMutation(),
    onSuccess: useInvalidateSupportTicket(ticketId, false),
  })
}

export function useReplyAdminSupportTicket(ticketId: string) {
  return useMutation({
    ...createAdminSupportMessageMutation(),
    onSuccess: useInvalidateSupportTicket(ticketId, true),
  })
}

export function useResolveAdminSupportTicket(ticketId: string) {
  return useMutation({
    ...resolveAdminSupportTicketMutation(),
    onSuccess: useInvalidateSupportTicket(ticketId, true),
  })
}
