import { createFileRoute } from '@tanstack/react-router'

import { NotificationsScreen } from './-notifications-screen'
import { guardStep } from './-steps'

export const Route = createFileRoute('/_authed/onboarding/notifications')({
  beforeLoad: ({ context }) => guardStep(context.queryClient, 'notifications'),
  component: NotificationsScreen,
})
