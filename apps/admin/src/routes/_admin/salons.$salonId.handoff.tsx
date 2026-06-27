import { createFileRoute } from '@tanstack/react-router'

import { SalonDetailPage } from '#/features/salons'

export const Route = createFileRoute('/_admin/salons/$salonId/handoff')({
  component: SalonHandoffRoute,
})

function SalonHandoffRoute() {
  const { salonId } = Route.useParams()
  return <SalonDetailPage salonId={salonId} section="handoff" />
}
