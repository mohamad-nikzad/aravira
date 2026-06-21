import { getAdminSupportTicketSummaryOptions } from '@repo/api-client/query'

export const SUPPORT_TICKET_SUMMARY_POLL_MS = 60_000

export function adminSupportTicketSummaryOptions(enabled = true) {
  return {
    ...getAdminSupportTicketSummaryOptions(),
    enabled,
    refetchInterval: SUPPORT_TICKET_SUMMARY_POLL_MS,
    refetchIntervalInBackground: false,
  }
}
