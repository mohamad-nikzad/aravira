import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminTopbar } from './admin-topbar'
import { SidebarProvider } from '#/components/ui/sidebar'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  permission: vi.fn(),
  summary: vi.fn(),
}))

vi.mock('@repo/api-client/query', () => ({
  getAdminSupportTicketSummaryOptions: () => ({
    queryKey: [{ _id: 'getAdminSupportTicketSummary', marker: 'generated' }],
    queryFn: mocks.summary,
  }),
}))

vi.mock('@repo/auth/platform', () => ({
  hasPlatformPermission: mocks.permission,
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mocks.navigate,
}))

vi.mock('#/context/admin-auth-provider', () => ({
  useAdminAuth: () => ({
    me: { role: 'platform_owner' },
    runtime: { dataSource: 'local' },
  }),
}))

vi.mock('#/context/search-provider', () => ({
  useSearch: () => ({ setOpen: vi.fn() }),
}))

vi.mock('#/context/theme-provider', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}))

function renderTopbar() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <AdminTopbar />
      </SidebarProvider>
    </QueryClientProvider>,
  )
  return queryClient
}

describe('AdminTopbar Support Ticket summary', () => {
  beforeEach(() => {
    mocks.navigate.mockReset()
    mocks.permission.mockReset().mockReturnValue(true)
    mocks.summary.mockReset()
  })

  afterEach(cleanup)

  it('uses a loading-neutral accessible state without a false zero', () => {
    mocks.summary.mockReturnValue(new Promise(() => undefined))
    renderTopbar()

    expect(
      screen
        .getByRole('button', {
          name: 'در حال دریافت خلاصه تیکت‌های پشتیبانی',
        })
        .hasAttribute('disabled'),
    ).toBe(true)
    expect(screen.queryByText('0')).toBeNull()
  })

  it('shows an explicit retry state after an initial error', async () => {
    mocks.summary.mockRejectedValueOnce(new Error('network'))
    renderTopbar()

    const retry = await screen.findByRole('button', {
      name: /ناموفق بود؛ تلاش دوباره/,
    })
    expect(screen.queryByText('0')).toBeNull()

    mocks.summary.mockResolvedValue({ unresolvedCount: 2, unreadCount: 0 })
    fireEvent.click(retry)
    expect(
      await screen.findByRole('button', { name: /2 تیکت حل‌نشده/ }),
    ).toBeTruthy()
  })

  it('does not fetch or render the indicator without permission', () => {
    mocks.permission.mockReturnValue(false)
    renderTopbar()

    expect(mocks.summary).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: /تیکت‌های پشتیبانی/ }),
    ).toBeNull()
  })

  it('shows successful counts and the distinct unread dot', async () => {
    mocks.summary.mockResolvedValue({ unresolvedCount: 12, unreadCount: 3 })
    renderTopbar()

    const button = await screen.findByRole('button', {
      name: /12 تیکت حل‌نشده، 3 پیام جدید/,
    })
    expect(screen.getByText('12')).toBeTruthy()
    expect(screen.getByTestId('support-ticket-unread-dot')).toBeTruthy()
    fireEvent.click(button)
    expect(mocks.navigate).toHaveBeenCalledWith({ to: '/support-tickets' })
  })

  it('retains prior counts while a background refetch is pending', async () => {
    mocks.summary.mockResolvedValueOnce({ unresolvedCount: 7, unreadCount: 1 })
    const queryClient = renderTopbar()
    expect(
      await screen.findByRole('button', { name: /7 تیکت حل‌نشده/ }),
    ).toBeTruthy()

    mocks.summary.mockReturnValue(new Promise(() => undefined))
    void queryClient.refetchQueries({
      queryKey: [{ _id: 'getAdminSupportTicketSummary', marker: 'generated' }],
    })

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /7 تیکت حل‌نشده/ }),
      ).toBeTruthy()
    })
  })
})
