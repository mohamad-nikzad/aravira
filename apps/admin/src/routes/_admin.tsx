import { createFileRoute } from '@tanstack/react-router'

import { AdminShell } from '#/components/layout/admin-shell'

export const Route = createFileRoute('/_admin')({
  component: AdminShell,
})
