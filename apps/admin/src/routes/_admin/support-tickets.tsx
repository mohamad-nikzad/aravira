import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requirePermission } from '#/lib/platform-rbac'
import { supportTicketSearchSchema } from '#/features/support-tickets/support-ticket-url-state'

export const Route = createFileRoute('/_admin/support-tickets')({
  validateSearch: supportTicketSearchSchema,
  beforeLoad: async ({ context }) => {
    await requirePermission(context.queryClient, 'view_support_tickets')
  },
  component: Outlet,
})
