import { createFileRoute } from '@tanstack/react-router'

import { SalonDetailPage } from '#/features/salons'

export const Route = createFileRoute('/_admin/salons/$salonId/clients')({
  component: SalonClientsRoute,
})

function SalonClientsRoute() {
  const { salonId } = Route.useParams()
  return <SalonDetailPage salonId={salonId} section="clients" />
}
