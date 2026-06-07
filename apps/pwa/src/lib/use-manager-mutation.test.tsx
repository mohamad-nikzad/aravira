// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { DataClient } from '@repo/data-client'

import {
  OFFLINE_WRITE_BLOCKED_MESSAGE,
  useManagerWriteMutation,
} from './use-manager-mutation'

const processPending = vi.fn(async () => {})
const fakeClient = { sync: { processPending } } as unknown as DataClient
const mockIsOnline = vi.fn(() => true)

vi.mock('#/lib/manager-data-client', () => ({
  useRequiredManagerDataClient: () => fakeClient,
}))

vi.mock('#/lib/network-status', () => ({
  useNetworkStatus: () => mockIsOnline(),
}))

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  processPending.mockClear()
  mockIsOnline.mockReturnValue(true)
})

describe('useManagerWriteMutation', () => {
  it('does not flush pending writes for require-online policy', async () => {
    const apiFn = vi.fn(async (value: number) => value + 1)

    const { result } = renderHook(
      () =>
        useManagerWriteMutation('appointmentRequest.approve', {
          apiFn,
        }),
      { wrapper },
    )

    const returned = await result.current.mutateAsync(5)

    expect(returned).toBe(6)
    expect(apiFn).toHaveBeenCalledWith(5)
    expect(processPending).not.toHaveBeenCalled()
  })

  it('throws OFFLINE_WRITE_BLOCKED_MESSAGE for require-online when offline', async () => {
    mockIsOnline.mockReturnValue(false)
    const apiFn = vi.fn(async (value: number) => value + 1)

    const { result } = renderHook(
      () =>
        useManagerWriteMutation('appointmentRequest.approve', {
          apiFn,
        }),
      { wrapper },
    )

    await expect(result.current.mutateAsync(5)).rejects.toThrow(
      OFFLINE_WRITE_BLOCKED_MESSAGE,
    )
    expect(apiFn).not.toHaveBeenCalled()
  })
})
