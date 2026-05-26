import { createFileRoute, redirect } from '@tanstack/react-router'

import { authQueryKey } from '#/lib/auth'
import { homePathForRole } from '#/lib/navigation'
import type { User } from '@repo/salon-core/types'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData<User | null>({
      queryKey: authQueryKey,
    })
    if (!user) {
      throw redirect({ to: '/login' })
    }
    throw redirect({ to: homePathForRole(user.role) })
  },
})
