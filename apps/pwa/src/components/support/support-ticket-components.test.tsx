// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ create: vi.fn(), reply: vi.fn() }))

vi.mock('#/lib/support-ticket-queries', () => ({
  useCreateSupportTicketMutation: () => ({
    mutateAsync: mocks.create,
    isPending: false,
    isError: false,
  }),
  useAddManagerSupportMessageMutation: () => ({
    mutateAsync: mocks.reply,
    isPending: false,
    isError: false,
  }),
}))

import { SupportTicketCreateForm } from './support-ticket-create-form'
import {
  SupportMessageBubble,
  SupportMessageComposer,
  SupportTicketThread,
} from './support-ticket-thread'

beforeEach(() => {
  vi.clearAllMocks()
  HTMLElement.prototype.scrollIntoView = vi.fn()
})
afterEach(cleanup)

describe('manager support components', () => {
  it('shows create validation and character counters', async () => {
    render(<SupportTicketCreateForm />)
    fireEvent.change(screen.getByLabelText('موضوع'), {
      target: { value: 'پرسش من' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'ارسال درخواست' }))
    expect(
      screen.getByText((_, element) => element?.textContent === '۷ / ۱۲۰'),
    ).toBeTruthy()
    expect(await screen.findAllByText('این فیلد الزامی است.')).toHaveLength(2)
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('retains the actual reply draft when sending fails', async () => {
    mocks.reply.mockRejectedValue(new Error('offline'))
    render(<SupportMessageComposer ticketId="ticket-1" resolved />)
    const input = screen.getByLabelText('پاسخ شما')
    fireEvent.change(input, { target: { value: 'پیش‌نویس مهم' } })
    fireEvent.click(screen.getByRole('button', { name: 'ارسال پاسخ' }))
    await waitFor(() =>
      expect(mocks.reply).toHaveBeenCalledWith('پیش‌نویس مهم'),
    )
    expect((input as HTMLTextAreaElement).value).toBe('پیش‌نویس مهم')
    expect(screen.getByText(/دوباره باز می‌کند/)).toBeTruthy()
  })

  it('retains the actual create draft when sending fails', async () => {
    mocks.create.mockRejectedValue(new Error('offline'))
    const { container } = render(<SupportTicketCreateForm />)
    const category = container.querySelector('select')
    if (!category) throw new Error('category select missing')
    fireEvent.change(category, { target: { value: 'question' } })
    const subject = screen.getByLabelText('موضوع') as HTMLInputElement
    const body = screen.getByLabelText('شرح درخواست') as HTMLTextAreaElement
    fireEvent.change(subject, { target: { value: 'پرسش مهم' } })
    fireEvent.change(body, { target: { value: 'شرح پیش‌نویس' } })
    fireEvent.click(screen.getByRole('button', { name: 'ارسال درخواست' }))
    await waitFor(() => expect(mocks.create).toHaveBeenCalled())
    expect(subject.value).toBe('پرسش مهم')
    expect(body.value).toBe('شرح پیش‌نویس')
  })

  it('renders manager snapshots and the fixed platform alias', () => {
    const { rerender } = render(
      <SupportMessageBubble
        grouped={false}
        message={{
          id: 'm1',
          authorKind: 'manager',
          authorUserId: 'u1',
          authorDisplayName: 'مریم احمدی',
          body: 'سلام',
          createdAt: '2026-06-21T10:00:00Z',
        }}
      />,
    )
    expect(screen.getByText('مریم احمدی')).toBeTruthy()
    rerender(
      <SupportMessageBubble
        grouped={false}
        message={{
          id: 'm2',
          authorKind: 'platform',
          authorDisplayName: 'پشتیبانی سالونا',
          body: 'پاسخ',
          createdAt: '2026-06-21T11:00:00Z',
        }}
      />,
    )
    expect(screen.getByText('پشتیبانی سالونا')).toBeTruthy()
  })

  it('moves final focus to the newly rendered message marker after a reply refetch', () => {
    const base = {
      ticket: {
        id: 'ticket-1',
        salonId: 'salon-1',
        submittedByUserId: 'u1',
        category: 'question' as const,
        subject: 'پرسش',
        status: 'open' as const,
        lastActivityAt: '2026-06-21T10:00:00Z',
        resolvedAt: null,
        createdAt: '2026-06-21T10:00:00Z',
      },
      managerHasUnread: false,
      truncated: false,
      messages: [
        {
          id: 'm1',
          authorKind: 'manager' as const,
          authorUserId: 'u1',
          authorDisplayName: 'مریم',
          body: 'اول',
          createdAt: '2026-06-21T10:00:00Z',
        },
      ],
    }
    const { rerender } = render(<SupportTicketThread detail={base} />)
    const composer = screen.getByLabelText('پاسخ شما') as HTMLTextAreaElement
    composer.focus()
    rerender(
      <SupportTicketThread
        detail={{
          ...base,
          messages: [
            ...base.messages,
            {
              id: 'm2',
              authorKind: 'platform' as const,
              authorDisplayName: 'پشتیبانی سالونا' as const,
              body: 'پاسخ تازه',
              createdAt: '2026-06-21T11:00:00Z',
            },
          ],
        }}
      />,
    )
    expect(document.activeElement?.getAttribute('aria-label')).toBe(
      'آخرین پیام گفت‌وگو',
    )
    expect(document.activeElement).not.toBe(composer)
  })
})
