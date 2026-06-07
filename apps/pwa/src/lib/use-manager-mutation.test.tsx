// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { DataClient } from '@repo/data-client'

import {
  OFFLINE_WRITE_BLOCKED_MESSAGE,
  useManagerMutation,
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
  it('flushes pending writes on success for queue-offline policy', async () => {
    const dataClientFn = vi.fn(
      async (_dc: DataClient, value: number) => value * 2,
    )

    const { result } = renderHook(
      () =>
        useManagerWriteMutation('appointment.update', {
          dataClientFn,
        }),
      { wrapper },
    )

    const returned = await result.current.mutateAsync(21)

    expect(returned).toBe(42)
    expect(dataClientFn).toHaveBeenCalledWith(fakeClient, 21)
    expect(processPending).toHaveBeenCalledTimes(1)
  })

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

  it('does not flush pending writes when the mutation fails', async () => {
    const dataClientFn = vi.fn(async () => {
      throw new Error('boom')
    })

    const { result } = renderHook(
      () =>
        useManagerWriteMutation('appointment.update', {
          dataClientFn,
        }),
      { wrapper },
    )

    await expect(result.current.mutateAsync()).rejects.toThrow('boom')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(processPending).not.toHaveBeenCalled()
  })
})

describe('useManagerMutation', () => {
  it('delegates to queue-offline write policy', async () => {
    const mutationFn = vi.fn(
      async (_dc: DataClient, value: number) => value * 2,
    )

    const { result } = renderHook(
      () => useManagerMutation('appointment.update', mutationFn),
      { wrapper },
    )

    const returned = await result.current.mutateAsync(21)

    expect(returned).toBe(42)
    expect(mutationFn).toHaveBeenCalledWith(fakeClient, 21)
    expect(processPending).toHaveBeenCalledTimes(1)
  })
})
