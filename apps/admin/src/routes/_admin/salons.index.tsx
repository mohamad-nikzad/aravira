import { createFileRoute } from '@tanstack/react-router'

import { AdminPage } from '#/features/admin-page'

export const Route = createFileRoute('/_admin/salons/')({
  component: SalonsIndexRoute,
})

function SalonsIndexRoute() {
  return <AdminPage pageId="salons" />
}
