// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  role: 'manager',
  pathname: '/settings',
  summary: vi.fn(),
  requests: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { pathname: string } }) => string
  }) => select({ location: { pathname: mocks.pathname } }),
}))

vi.mock('#/lib/auth', () => ({
  useAuth: () => ({ user: { role: mocks.role } }),
}))

vi.mock('#/lib/support-ticket-queries', () => ({
  supportTicketSummaryQueryOptions: () => ({
    queryKey: ['support-summary'],
    queryFn: mocks.summary,
  }),
}))

vi.mock('#/lib/appointment-requests-queries', () => ({
  pendingAppointmentRequestsQueryOptions: () => ({
    queryKey: ['pending-requests'],
    queryFn: mocks.requests,
  }),
}))

import { BottomNav } from '#/components/bottom-nav'
import { SupportSettingsRow } from './support-settings-row'

function renderWithQuery(children: ReactNode) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {children}
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.role = 'manager'
  mocks.pathname = '/settings'
  mocks.summary.mockResolvedValue({ unreadCount: 125 })
  mocks.requests.mockResolvedValue({ requests: [] })
})
afterEach(cleanup)

describe('support navigation visibility and badges', () => {
  it('shows the manager Settings row with a capped Persian unread badge', async () => {
    renderWithQuery(<SupportSettingsRow enabled />)
    expect(
      screen.getByRole('link', { name: /پشتیبانی/ }).getAttribute('href'),
    ).toBe('/support')
    expect(await screen.findByText('۹۹+')).toBeTruthy()
    expect(mocks.summary).toHaveBeenCalledTimes(1)
  })

  it('hides the Settings row and disables its summary query for staff', async () => {
    renderWithQuery(<SupportSettingsRow enabled={false} />)
    expect(screen.queryByText('پشتیبانی')).toBeNull()
    await waitFor(() => expect(mocks.summary).not.toHaveBeenCalled())
  })

  it('shows the same shared unread badge on the manager More item', async () => {
    renderWithQuery(<BottomNav />)
    expect(
      await screen.findByLabelText('125 پیام پشتیبانی خوانده‌نشده'),
    ).toBeTruthy()
    expect(screen.getByText('۹۹+')).toBeTruthy()
  })

  it.each([
    ['staff', '/settings'],
    ['manager', '/onboarding/welcome'],
  ])('disables the nav summary for %s on %s', async (role, pathname) => {
    mocks.role = role
    mocks.pathname = pathname
    renderWithQuery(<BottomNav />)
    await waitFor(() => expect(mocks.summary).not.toHaveBeenCalled())
  })
})
