import { createFileRoute } from '@tanstack/react-router'

import { AdminPage } from '#/features/admin-page'

export const Route = createFileRoute('/_admin/catalog-presets')({
  component: CatalogPresetsRoute,
})

function CatalogPresetsRoute() {
  return <AdminPage pageId="catalog-presets" />
}
