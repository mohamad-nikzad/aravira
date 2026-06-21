// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import type { ManagerSupportTicketListItem } from '@repo/api-client/types'

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({
    children,
    to,
    params,
    ...props
  }: {
    children: ReactNode
    to: string
    params?: { ticketId: string }
  }) => (
    <a href={params ? to.replace('$ticketId', params.ticketId) : to} {...props}>
      {children}
    </a>
  ),
}))

import {
  SupportTicketEmpty,
  SupportTicketList,
  SupportTicketListError,
  SupportTicketListSkeleton,
  SupportTicketPagination,
} from './support-ticket-list'

const ticket = (
  overrides: Partial<ManagerSupportTicketListItem> = {},
): ManagerSupportTicketListItem => ({
  id: 'ticket-1',
  category: 'question',
  subject: 'پرسش قدیمی',
  status: 'open',
  lastActivityAt: '2026-06-20T10:00:00Z',
  createdAt: '2026-06-20T10:00:00Z',
  managerHasUnread: false,
  lastMessage: {
    body: 'متن',
    authorKind: 'platform',
    authorDisplayName: 'پشتیبانی سالونا',
  },
  ...overrides,
})

afterEach(cleanup)

describe('support ticket list states', () => {
  it('renders loading, empty, and error/retry states', () => {
    const { rerender } = render(<SupportTicketListSkeleton />)
    expect(screen.getByLabelText('در حال بارگذاری')).toBeTruthy()
    rerender(<SupportTicketEmpty />)
    expect(screen.getByText('هنوز درخواستی ندارید')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: /درخواست جدید/ }).getAttribute('href'),
    ).toBe('/support/new')
    const retry = vi.fn()
    rerender(<SupportTicketListError retry={retry} />)
    fireEvent.click(screen.getByRole('button', { name: /تلاش دوباره/ }))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('orders newest activity first and exposes unread state to screen readers', () => {
    render(
      <SupportTicketList
        items={[
          ticket(),
          ticket({
            id: 'ticket-2',
            subject: 'پرسش جدید',
            lastActivityAt: '2026-06-21T10:00:00Z',
            managerHasUnread: true,
          }),
        ]}
      />,
    )
    const links = screen.getAllByRole('link')
    expect(links[0].textContent).toContain('پرسش جدید')
    expect(links[0].className).toContain('border-primary/35')
    expect(screen.getByText('خوانده‌نشده').className).toContain('sr-only')
  })

  it('supports complete previous/next pagination with Persian page labels', () => {
    const change = vi.fn()
    const { rerender } = render(
      <SupportTicketPagination page={1} hasNext onPageChange={change} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'صفحه بعد' }))
    expect(change).toHaveBeenCalledWith(2)
    rerender(<SupportTicketPagination page={2} hasNext onPageChange={change} />)
    expect(screen.getByText('صفحه ۲')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'صفحه قبل' }))
    expect(change).toHaveBeenCalledWith(1)
  })
})
