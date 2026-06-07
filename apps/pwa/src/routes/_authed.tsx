import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import type { User } from '@repo/salon-core/types'

import { authQueryKey } from '#/lib/auth'
import { BottomNav } from '#/components/bottom-nav'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData<User | null>({
      queryKey: authQueryKey,
    })
    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    if (
      user.role === 'manager' &&
      user.needsOnboarding &&
      !location.pathname.startsWith('/onboarding')
    ) {
      throw redirect({ to: '/onboarding' })
    }

    return { user }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const hideChrome = pathname.startsWith('/onboarding')

  return (
    <div className="flex h-dvh flex-col bg-background">
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      {!hideChrome && <BottomNav />}
    </div>
  )
}
