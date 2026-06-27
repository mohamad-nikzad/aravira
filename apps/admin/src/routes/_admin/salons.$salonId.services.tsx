import { createFileRoute } from '@tanstack/react-router'

import { SalonDetailPage } from '#/features/salons'

export const Route = createFileRoute('/_admin/salons/$salonId/services')({
  component: SalonServicesRoute,
})

function SalonServicesRoute() {
  const { salonId } = Route.useParams()
  return <SalonDetailPage salonId={salonId} section="services" />
}
