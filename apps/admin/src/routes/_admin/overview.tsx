import { createFileRoute } from '@tanstack/react-router'

import { AdminPage } from '#/features/admin-page'

export const Route = createFileRoute('/_admin/overview')({
  component: OverviewRoute,
})

function OverviewRoute() {
  return <AdminPage pageId="overview" />
}
