import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export function requireManagerSupportAccess(role: string) {
  if (role !== 'manager') {
    throw redirect({ to: '/today' })
  }
}

export const Route = createFileRoute('/_authed/support')({
  beforeLoad: ({ context }) => {
    requireManagerSupportAccess(context.user.role)
  },
  component: SupportLayout,
})

function SupportLayout() {
  return <Outlet />
}
