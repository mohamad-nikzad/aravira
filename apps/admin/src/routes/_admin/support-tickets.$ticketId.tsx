import { createFileRoute } from '@tanstack/react-router'

import { SupportTicketDetailPage } from '#/features/support-tickets'
import { requirePermission } from '#/lib/platform-rbac'

export const Route = createFileRoute('/_admin/support-tickets/$ticketId')({
  beforeLoad: async ({ context }) => {
    await requirePermission(context.queryClient, 'view_support_tickets')
  },
  component: SupportTicketDetailPage,
})
