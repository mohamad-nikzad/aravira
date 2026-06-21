// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  getOnboarding: vi.fn(),
  listMessagingAccounts: vi.fn(),
  connectByProvider: new Map<string, ReturnType<typeof vi.fn>>(),
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => config,
  useNavigate: () => mocks.navigate,
}))

vi.mock('#/lib/onboarding-queries', () => ({
  getApiV1OnboardingQueryKey: () => [{ _id: 'getApiV1Onboarding' }],
  onboardingQueryOptions: () => ({
    queryKey: [{ _id: 'getApiV1Onboarding' }],
    queryFn: mocks.getOnboarding,
  }),
}))

vi.mock('#/lib/messaging-queries', () => ({
  getApiV1MessagingAccountsQueryKey: () => [
    { _id: 'getApiV1MessagingAccounts' },
  ],
  messagingAccountsQueryOptions: () => ({
    queryKey: [{ _id: 'getApiV1MessagingAccounts' }],
    queryFn: mocks.listMessagingAccounts,
  }),
}))

vi.mock('#/components/messaging/use-messaging-connect', () => ({
  useMessagingConnect: (provider: string) => {
    const connect = vi.fn()
    mocks.connectByProvider.set(provider, connect)
    return {
      connect,
      isPending: false,
      linkError: null,
      clearError: vi.fn(),
    }
  },
}))

vi.mock('#/components/messaging/use-telegram-focus-refresh', () => ({
  useTelegramFocusRefresh: vi.fn(),
}))

import { NotificationsScreen } from './-notifications-screen'

function renderWithQuery(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.connectByProvider.clear()
  mocks.getOnboarding.mockResolvedValue({
    onboarding: {
      steps: {
        notificationsConfigured: false,
      },
    },
  })
  mocks.listMessagingAccounts.mockResolvedValue({
    providers: [
      { id: 'telegram', displayName: 'Telegram' },
      { id: 'bale', displayName: 'Bale' },
    ],
    accounts: [],
  })
})

afterEach(() => {
  cleanup()
})

describe('NotificationsScreen', () => {
  it('renders Telegram and Bale connect cards from configured providers', async () => {
    renderWithQuery(<NotificationsScreen />)

    expect(await screen.findByText('ربات تلگرام')).toBeTruthy()
    expect(screen.getByText('اتصال به ربات تلگرام')).toBeTruthy()
    expect(screen.getByText('ربات بله')).toBeTruthy()
    expect(screen.getByText('اتصال به ربات بله')).toBeTruthy()
  })

  it('hides Telegram when only Bale is configured', async () => {
    mocks.listMessagingAccounts.mockResolvedValue({
      providers: [{ id: 'bale', displayName: 'Bale' }],
      accounts: [],
    })

    renderWithQuery(<NotificationsScreen />)

    expect(await screen.findByText('ربات بله')).toBeTruthy()
    await waitFor(() => {
      expect(screen.queryByText('ربات تلگرام')).toBeNull()
      expect(screen.queryByText('اتصال به ربات تلگرام')).toBeNull()
    })
  })

  it('does not offer connect actions when no providers are configured', async () => {
    mocks.listMessagingAccounts.mockResolvedValue({
      providers: [],
      accounts: [],
    })

    renderWithQuery(<NotificationsScreen />)

    expect(
      await screen.findByText(
        /فعلاً پیام‌رسانی برای اتصال فعال نیست\. می‌توانید این مرحله را ادامه دهید\./,
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/اتصال به ربات/)).toBeNull()
  })

  it('shows a linked provider without a connect button', async () => {
    mocks.listMessagingAccounts.mockResolvedValue({
      providers: [{ id: 'telegram', displayName: 'Telegram' }],
      accounts: [
        {
          id: 'telegram-account',
          provider: 'telegram',
          displayName: 'مدیر تلگرام',
          enabled: true,
          linkedAt: '2026-06-07T00:00:00.000Z',
        },
      ],
    })

    renderWithQuery(<NotificationsScreen />)

    expect(await screen.findByText('ربات تلگرام')).toBeTruthy()
    expect(
      screen.getByText('متصل شد؛ نوبت‌ها به تلگرام شما ارسال می‌شوند.'),
    ).toBeTruthy()
    expect(screen.queryByText('اتصال به ربات تلگرام')).toBeNull()
  })
})
