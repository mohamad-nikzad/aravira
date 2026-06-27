import { createFileRoute, useLocation } from '@tanstack/react-router'

import { SalonDetailPage } from '#/features/salons'
import type { SalonWorkspaceSection } from '#/features/salons/salon-detail'

export const Route = createFileRoute('/_admin/salons/$salonId')({
  component: SalonDetailRoute,
})

function SalonDetailRoute() {
  const { salonId } = Route.useParams()
  const location = useLocation()
  return (
    <SalonDetailPage
      salonId={salonId}
      section={sectionFromPathname(location.pathname)}
    />
  )
}

function sectionFromPathname(pathname: string): SalonWorkspaceSection {
  const section = pathname.split('/').filter(Boolean).at(-1)
  if (
    section === 'edit' ||
    section === 'hours' ||
    section === 'presence' ||
    section === 'staff' ||
    section === 'services' ||
    section === 'clients' ||
    section === 'requests' ||
    section === 'handoff'
  ) {
    return section
  }
  return 'overview'
}
