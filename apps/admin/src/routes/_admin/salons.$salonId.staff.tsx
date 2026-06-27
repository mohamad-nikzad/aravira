import { createFileRoute } from '@tanstack/react-router'

import { SalonDetailPage } from '#/features/salons'

export const Route = createFileRoute('/_admin/salons/$salonId/staff')({
  component: SalonStaffRoute,
})

function SalonStaffRoute() {
  const { salonId } = Route.useParams()
  return <SalonDetailPage salonId={salonId} section="staff" />
}
