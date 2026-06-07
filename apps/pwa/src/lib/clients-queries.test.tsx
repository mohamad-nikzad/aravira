// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import {
  clientsListQueryOptions,
  getApiV1ClientsQueryKey,
  useCreateClientMutation,
} from '#/lib/clients-queries'

const getApiV1Clients = vi.fn()
const postApiV1Clients = vi.fn()
vi.mock('@repo/api-client/sdk', () => ({
  getApiV1Clients: (...args: unknown[]) => getApiV1Clients(...args),
  postApiV1Clients: (...args: unknown[]) => postApiV1Clients(...args),
  getApiV1ClientsByIdSummary: vi.fn(),
  patchApiV1ClientsById: vi.fn(),
}))

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  getApiV1Clients.mockReset()
  postApiV1Clients.mockReset()
})

describe('clients-queries', () => {
  it('exposes generated clients list query keys', () => {
    expect(getApiV1ClientsQueryKey()[0]._id).toBe('getApiV1Clients')
  })

  it('selects clients from the generated list response', async () => {
    getApiV1Clients.mockResolvedValue({
      data: { clients: [{ id: 'client-1', name: 'Sara' }] },
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const data = await queryClient.fetchQuery(clientsListQueryOptions())

    expect(data).toEqual([{ id: 'client-1', name: 'Sara' }])
  })

  it('creates clients online via generated mutation helper', async () => {
    postApiV1Clients.mockResolvedValue({
      data: { client: { id: 'client-2', name: 'Neda', phone: '09120000000' } },
    })

    const { result } = renderHook(() => useCreateClientMutation(), { wrapper })

    const created = await result.current.mutateAsync({
      name: 'Neda',
      phone: '09120000000',
      notes: '',
      tags: [],
    })

    expect(created.id).toBe('client-2')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
