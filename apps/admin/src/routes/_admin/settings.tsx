import { createFileRoute } from '@tanstack/react-router'

import { AdminPage } from '#/features/admin-page'

export const Route = createFileRoute('/_admin/settings')({
  component: SettingsRoute,
})

function SettingsRoute() {
  return <AdminPage pageId="settings" />
}
