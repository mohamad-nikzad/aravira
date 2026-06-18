import { createFileRoute } from '@tanstack/react-router'

import { AdminPage } from '#/features/admin-page'

export const Route = createFileRoute('/_admin/audit-log')({
  component: AuditLogRoute,
})

function AuditLogRoute() {
  return <AdminPage pageId="audit-log" />
}
