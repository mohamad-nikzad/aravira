import { createFileRoute } from '@tanstack/react-router'

import { SalonDetailPage } from '#/features/salons'

export const Route = createFileRoute('/_admin/salons/$salonId')({
  component: SalonDetailRoute,
})

function SalonDetailRoute() {
  const { salonId } = Route.useParams()
  return <SalonDetailPage salonId={salonId} />
}
