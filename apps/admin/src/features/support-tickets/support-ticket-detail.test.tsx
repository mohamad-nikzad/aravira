import type { AdminSupportTicketDetailResponse } from '@repo/api-client/types'
import {
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import {
  SupportTicketDetail,
  useReadAfterTicketLoad,
} from './support-ticket-detail'

const mutations = vi.hoisted(() => ({
  reply: vi.fn(),
  resolve: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children: ReactNode }) => (
    <a {...props}>{children}</a>
  ),
  useParams: () => ({ ticketId: 'ticket-1' }),
}))

vi.mock('./support-ticket-queries', () => ({
  adminSupportTicketDetailOptions: vi.fn(),
  useMarkAdminSupportTicketRead: () => ({ mutate: vi.fn() }),
  useReplyAdminSupportTicket: () => ({
    mutateAsync: mutations.reply,
    isPending: false,
    isError: false,
  }),
  useResolveAdminSupportTicket: () => ({
    mutateAsync: mutations.resolve,
    isPending: false,
    isError: false,
  }),
}))

const detail: AdminSupportTicketDetailResponse = {
  ticket: {
    id: '11111111-1111-4111-8111-111111111111',
    salonId: '22222222-2222-4222-8222-222222222222',
    submittedByUserId: '33333333-3333-4333-8333-333333333333',
    submittedByDisplayName: 'مینا احمدی',
    salonName: 'سالن آفتاب',
    category: 'feature_request',
    subject: 'گزارش خروجی',
    status: 'open',
    lastActivityAt: '2026-06-20T10:00:00.000Z',
    resolvedAt: null,
    resolvedByUserId: null,
    createdAt: '2026-06-20T09:00:00.000Z',
  },
  platformHasUnread: true,
  truncated: false,
  messages: [
    {
      id: '44444444-4444-4444-8444-444444444444',
      authorKind: 'manager',
      authorUserId: '33333333-3333-4333-8333-333333333333',
      authorDisplayName: 'مینا احمدی',
      body: 'لطفاً خروجی ماهانه اضافه شود.',
      createdAt: '2026-06-20T09:00:00.000Z',
    },
    {
      id: '55555555-5555-4555-8555-555555555555',
      authorKind: 'platform',
      authorUserId: '66666666-6666-4666-8666-666666666666',
      authorDisplayName: 'پشتیبان واقعی',
      body: 'در حال بررسی است.',
      createdAt: '2026-06-20T10:00:00.000Z',
    },
  ],
}

describe('admin Support Ticket detail', () => {
  beforeEach(() => {
    mutations.reply.mockReset()
    mutations.resolve.mockReset()
    mutations.reply.mockResolvedValue({
      resultingStatus: 'waiting_for_manager',
    })
    mutations.resolve.mockResolvedValue({ resultingStatus: 'resolved' })
  })

  afterEach(cleanup)

  it('renders immutable messages with real internal identities and keeps viewers read-only', () => {
    render(
      <SupportTicketDetail
        detail={detail}
        ticketId={detail.ticket.id}
        currentAdmin={{ id: 'viewer-id', name: 'بیننده واقعی' }}
        canReply={false}
        canResolve={false}
      />,
    )

    expect(screen.getByText('پشتیبان واقعی')).toBeTruthy()
    expect(
      screen.getByText('66666666-6666-4666-8666-666666666666'),
    ).toBeTruthy()
    expect(screen.getByText('پیام‌ها قابل ویرایش یا حذف نیستند')).toBeTruthy()
    expect(screen.getByText('دسترسی فقط‌خواندنی')).toBeTruthy()
    expect(screen.queryByLabelText('متن پاسخ')).toBeNull()
    expect(screen.queryByRole('button', { name: 'حل بدون پاسخ' })).toBeNull()
  })

  it('sends distinct reply and reply-and-resolve payloads and shows feature-request noncommitment', async () => {
    render(
      <SupportTicketDetail
        detail={detail}
        ticketId={detail.ticket.id}
        currentAdmin={{ id: 'admin-real-id', name: 'ادمین واقعی' }}
        canReply
        canResolve
      />,
    )

    expect(screen.getByText(/حل این گفت‌وگو به معنی پذیرش/)).toBeTruthy()
    expect(screen.getByText('ادمین واقعی')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('متن پاسخ'), {
      target: { value: 'پاسخ نخست' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'ارسال پاسخ' }))

    await waitFor(() =>
      expect(mutations.reply).toHaveBeenCalledWith({
        path: { ticketId: detail.ticket.id },
        body: { body: 'پاسخ نخست', resolveAfter: false },
      }),
    )

    fireEvent.change(screen.getByLabelText('متن پاسخ'), {
      target: { value: 'پاسخ نهایی' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'ارسال و حل کردن' }))
    await waitFor(() =>
      expect(mutations.reply).toHaveBeenLastCalledWith({
        path: { ticketId: detail.ticket.id },
        body: { body: 'پاسخ نهایی', resolveAfter: true },
      }),
    )
  })

  it('requires confirmation before resolving without a reply', async () => {
    render(
      <SupportTicketDetail
        detail={detail}
        ticketId={detail.ticket.id}
        currentAdmin={{ id: 'admin-real-id', name: 'ادمین واقعی' }}
        canReply
        canResolve
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'حل بدون پاسخ' }))
    expect(screen.getByText('حل این تیکت بدون پاسخ؟')).toBeTruthy()
    expect(mutations.resolve).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'تأیید حل تیکت' }))
    await waitFor(() =>
      expect(mutations.resolve).toHaveBeenCalledWith({
        path: { ticketId: detail.ticket.id },
      }),
    )
  })

  it('retries a transient read failure and resets the gate for the next ticket', async () => {
    const markRead = vi
      .fn()
      .mockImplementationOnce(({ onError }) => onError())
      .mockImplementation(({ onSuccess }) => onSuccess())

    const { rerender } = renderHook(
      ({ ticketId }) => useReadAfterTicketLoad(ticketId, true, markRead),
      { initialProps: { ticketId: 'ticket-1' } },
    )

    await waitFor(() => expect(markRead).toHaveBeenCalledTimes(2))
    rerender({ ticketId: 'ticket-2' })
    await waitFor(() => expect(markRead).toHaveBeenCalledTimes(3))
  })
})
