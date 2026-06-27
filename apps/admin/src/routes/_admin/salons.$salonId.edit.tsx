import { createFileRoute } from '@tanstack/react-router'

import { SalonDetailPage } from '#/features/salons'

export const Route = createFileRoute('/_admin/salons/$salonId/edit')({
  component: SalonEditRoute,
})

function SalonEditRoute() {
  const { salonId } = Route.useParams()
  return <SalonDetailPage salonId={salonId} section="edit" />
}
