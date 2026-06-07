import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/clients')({
  beforeLoad: ({ context }) => {
    if (context.user.role !== 'manager') {
      throw redirect({ to: '/today' })
    }
  },
  component: ClientsLayout,
})

function ClientsLayout() {
  return <Outlet />
}
