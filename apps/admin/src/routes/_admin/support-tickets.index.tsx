import { createFileRoute } from '@tanstack/react-router'

import { SupportTicketInboxPage } from '#/features/support-tickets'

export const Route = createFileRoute('/_admin/support-tickets/')({
  component: SupportTicketInboxPage,
})
