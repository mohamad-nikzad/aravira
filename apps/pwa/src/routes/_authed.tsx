import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import type { User } from '@repo/salon-core/types'

import { authQueryKey } from '#/lib/auth'
import { BottomNav } from '#/components/bottom-nav'
import { ManagerSyncBar } from '#/components/manager-sync-bar'
import { ManagerDataClientProvider } from '#/lib/manager-data-client'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData<User | null>({
      queryKey: authQueryKey,
    })
    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      })
    }
    return { user }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  return (
    <ManagerDataClientProvider>
      <div className="flex h-dvh flex-col bg-background">
        <ManagerSyncBar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </ManagerDataClientProvider>
  )
}
