import { createFileRoute } from '@tanstack/react-router'

import { SalonDetailPage } from '#/features/salons'

export const Route = createFileRoute('/_admin/salons/$salonId/hours')({
  component: SalonHoursRoute,
})

function SalonHoursRoute() {
  const { salonId } = Route.useParams()
  return <SalonDetailPage salonId={salonId} section="hours" />
}
