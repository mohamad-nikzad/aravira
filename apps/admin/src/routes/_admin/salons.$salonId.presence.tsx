import { createFileRoute } from '@tanstack/react-router'

import { SalonDetailPage } from '#/features/salons'

export const Route = createFileRoute('/_admin/salons/$salonId/presence')({
  component: SalonPresenceRoute,
})

function SalonPresenceRoute() {
  const { salonId } = Route.useParams()
  return <SalonDetailPage salonId={salonId} section="presence" />
}
