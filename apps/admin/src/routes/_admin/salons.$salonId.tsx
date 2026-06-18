import { createFileRoute } from '@tanstack/react-router'

import { AdminPage } from '#/features/admin-page'

export const Route = createFileRoute('/_admin/salons/$salonId')({
  component: SalonDetailRoute,
})

function SalonDetailRoute() {
  return <AdminPage pageId="salons" />
}
