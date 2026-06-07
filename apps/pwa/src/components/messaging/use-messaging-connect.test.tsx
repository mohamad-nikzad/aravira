// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mocks = vi.hoisted(() => ({
  createLink: vi.fn(),
}))

vi.mock('#/lib/messaging-queries', () => ({
  useCreateMessagingLinkMutation: () => ({
    mutate: mocks.createLink,
    isPending: false,
  }),
}))

import { useMessagingConnect } from './use-messaging-connect'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.createLink.mockImplementation((_provider, options) => {
    options?.onSuccess?.({
      deepLink: 'https://ble.ir/saluna_bot?start=token',
      expiresAt: '2026-06-07T00:00:00.000Z',
    })
  })
  vi.spyOn(window, 'open').mockImplementation(() => null)
})

describe('useMessagingConnect', () => {
  it('creates a provider-specific Bale link and opens it', async () => {
    const { result } = renderHook(() => useMessagingConnect('bale'), {
      wrapper,
    })

    await act(async () => {
      result.current.connect()
    })

    await waitFor(() => {
      expect(mocks.createLink).toHaveBeenCalledWith(
        'bale',
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      )
    })
    expect(window.open).toHaveBeenCalledWith(
      'https://ble.ir/saluna_bot?start=token',
      '_blank',
      'noopener,noreferrer',
    )
  })
})
