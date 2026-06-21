// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import {
  QueryClient,
  QueryClientProvider,
  type QueryKey,
} from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getManagerSupportTicketQueryKey,
  getManagerSupportTicketSummaryQueryKey,
  listManagerSupportTicketsQueryKey,
  supportTicketDetailQueryOptions,
  supportTicketListQueryOptions,
  supportTicketSummaryQueryOptions,
  useAddManagerSupportMessageMutation,
  useCreateSupportTicketMutation,
  useMarkSupportTicketReadMutation,
} from '#/lib/support-ticket-queries'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  reply: vi.fn(),
  read: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => mocks.navigate,
}))

vi.mock('@repo/api-client/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@repo/api-client/query')>()),
  createManagerSupportTicketMutation: () => ({ mutationFn: mocks.create }),
  createManagerSupportMessageMutation: () => ({ mutationFn: mocks.reply }),
  markManagerSupportTicketReadMutation: () => ({ mutationFn: mocks.read }),
}))

function createTestHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return { queryClient, wrapper }
}

function invalidatedIds(invalidate: { mock: { calls: unknown[][] } }) {
  return invalidate.mock.calls.map((call) => {
    const filters = call[0] as { queryKey?: QueryKey }
    const queryKey = filters?.queryKey as QueryKey
    return (queryKey[0] as { _id: string })._id
  })
}

const mutationResponse = {
  previousStatus: null,
  resultingStatus: 'open' as const,
  ticket: {
    id: 'ticket-1',
    salonId: 'salon-1',
    submittedByUserId: 'manager-1',
    category: 'question' as const,
    subject: 'پرسش آزمایشی',
    status: 'open' as const,
    lastActivityAt: '2026-06-21T10:00:00.000Z',
    resolvedAt: null,
    createdAt: '2026-06-21T10:00:00.000Z',
  },
  message: {
    id: 'message-1',
    ticketId: 'ticket-1',
    authorUserId: 'manager-1',
    authorKind: 'manager' as const,
    authorDisplayNameSnapshot: 'مدیر آزمایشی',
    body: 'متن پیام',
    createdAt: '2026-06-21T10:00:00.000Z',
  },
}

beforeEach(() => {
  mocks.create.mockReset()
  mocks.reply.mockReset()
  mocks.read.mockReset()
  mocks.navigate.mockReset()
})

describe('support-ticket-queries', () => {
  it('uses generated ticket-specific detail keys', () => {
    const first = supportTicketDetailQueryOptions('ticket-1').queryKey
    const second = supportTicketDetailQueryOptions('ticket-2').queryKey

    expect(first).toEqual(
      getManagerSupportTicketQueryKey({ path: { ticketId: 'ticket-1' } }),
    )
    expect(first).not.toEqual(second)
    expect((first[0] as { path: { ticketId: string } }).path.ticketId).toBe(
      'ticket-1',
    )
  })

  it('polls list and summary every minute only while focused', () => {
    expect(supportTicketListQueryOptions()).toMatchObject({
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
    })
    expect(supportTicketSummaryQueryOptions()).toMatchObject({
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
    })
  })

  it('seeds the created detail, invalidates list/summary, and navigates', async () => {
    mocks.create.mockResolvedValue(mutationResponse)
    mocks.navigate.mockResolvedValue(undefined)
    const { queryClient, wrapper } = createTestHarness()
    const invalidate = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined)
    const { result } = renderHook(() => useCreateSupportTicketMutation(), {
      wrapper,
    })

    await act(async () => {
      await result.current.mutateAsync({
        category: 'question',
        subject: 'پرسش آزمایشی',
        body: 'متن پیام',
      })
    })

    expect(mocks.create).toHaveBeenCalledWith(
      {
        body: {
          category: 'question',
          subject: 'پرسش آزمایشی',
          body: 'متن پیام',
        },
      },
      expect.anything(),
    )
    expect(invalidatedIds(invalidate)).toEqual([
      (listManagerSupportTicketsQueryKey()[0] as { _id: string })._id,
      (getManagerSupportTicketSummaryQueryKey()[0] as { _id: string })._id,
    ])
    expect(
      queryClient.getQueryData(
        supportTicketDetailQueryOptions('ticket-1').queryKey,
      ),
    ).toMatchObject({
      ticket: { id: 'ticket-1' },
      managerHasUnread: false,
      messages: [
        {
          id: 'message-1',
          authorDisplayName: 'مدیر آزمایشی',
          body: 'متن پیام',
        },
      ],
      truncated: false,
    })
    expect(mocks.navigate).toHaveBeenCalledWith({
      to: '/support/$ticketId',
      params: { ticketId: 'ticket-1' },
    })
  })

  it('invalidates the selected detail, list, and summary after a reply', async () => {
    mocks.reply.mockResolvedValue({
      ...mutationResponse,
      previousStatus: 'open',
    })
    const { queryClient, wrapper } = createTestHarness()
    const invalidate = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined)
    const { result } = renderHook(
      () => useAddManagerSupportMessageMutation('ticket-1'),
      { wrapper },
    )

    await act(async () => {
      await result.current.mutateAsync('پاسخ مدیر')
    })

    expect(mocks.reply).toHaveBeenCalledWith(
      {
        path: { ticketId: 'ticket-1' },
        body: { body: 'پاسخ مدیر' },
      },
      expect.anything(),
    )
    expect(invalidatedIds(invalidate)).toEqual([
      'getManagerSupportTicket',
      'listManagerSupportTickets',
      'getManagerSupportTicketSummary',
    ])
  })

  it('clears cached unread state and invalidates detail/list/summary after read', async () => {
    mocks.read.mockResolvedValue({
      ticketId: 'ticket-1',
      readAt: '2026-06-21T10:00:00.000Z',
    })
    const { queryClient, wrapper } = createTestHarness()
    const detailKey = supportTicketDetailQueryOptions('ticket-1').queryKey
    queryClient.setQueryData(detailKey, {
      ticket: mutationResponse.ticket,
      managerHasUnread: true,
      messages: [],
      truncated: false,
    })
    const invalidate = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined)
    const { result } = renderHook(
      () => useMarkSupportTicketReadMutation('ticket-1'),
      { wrapper },
    )

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(queryClient.getQueryData(detailKey)).toMatchObject({
      managerHasUnread: false,
    })
    expect(invalidatedIds(invalidate)).toEqual([
      'getManagerSupportTicket',
      'listManagerSupportTickets',
      'getManagerSupportTicketSummary',
    ])
  })

  it('does not run create success effects after a failed write', async () => {
    mocks.create.mockRejectedValue(new Error('network unavailable'))
    const { queryClient, wrapper } = createTestHarness()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const setQueryData = vi.spyOn(queryClient, 'setQueryData')
    const { result } = renderHook(() => useCreateSupportTicketMutation(), {
      wrapper,
    })

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          category: 'question',
          subject: 'پرسش آزمایشی',
          body: 'متن پیام',
        }),
      ).rejects.toThrow('network unavailable')
    })

    expect(invalidate).not.toHaveBeenCalled()
    expect(setQueryData).not.toHaveBeenCalled()
    expect(mocks.navigate).not.toHaveBeenCalled()
  })

  it('does not invalidate ticket queries after a failed reply', async () => {
    mocks.reply.mockRejectedValue(new Error('network unavailable'))
    const { queryClient, wrapper } = createTestHarness()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const setQueryData = vi.spyOn(queryClient, 'setQueryData')
    const { result } = renderHook(
      () => useAddManagerSupportMessageMutation('ticket-1'),
      { wrapper },
    )

    await act(async () => {
      await expect(result.current.mutateAsync('پیش‌نویس مهم')).rejects.toThrow(
        'network unavailable',
      )
    })

    expect(invalidate).not.toHaveBeenCalled()
    expect(setQueryData).not.toHaveBeenCalled()
  })
})
