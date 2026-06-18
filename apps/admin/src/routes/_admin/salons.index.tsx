import { createFileRoute } from '@tanstack/react-router'

import { SalonsListPage } from '#/features/salons'

export const Route = createFileRoute('/_admin/salons/')({
  component: SalonsIndexRoute,
})

function SalonsIndexRoute() {
  return <SalonsListPage />
}
