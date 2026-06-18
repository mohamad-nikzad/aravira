import { createFileRoute } from '@tanstack/react-router'

import { AdminLoginPage } from '#/features/admin-login-page'

export const Route = createFileRoute('/login')({
  component: AdminLoginPage,
})
