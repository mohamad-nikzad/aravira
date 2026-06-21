import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  locationSearch,
  renderAdminRoute,
} from '#/test/render-with-search-route'

import { supportTicketCategoryLabels } from './support-ticket-labels'

const api = vi.hoisted(() => ({
  list: vi.fn(),
  detail: vi.fn(),
  markRead: vi.fn(),
  auth: vi.fn(),
}))

vi.mock('@repo/api-client/query', () => ({
  getApiV1AdminAuthMeOptions: () => ({
    queryKey: ['admin-auth-me'],
    queryFn: api.auth,
  }),
  getAdminSupportTicketSummaryOptions: () => ({
    queryKey: [{ _id: 'getAdminSupportTicketSummary' }],
    queryFn: async () => ({ unresolvedCount: 1, unreadCount: 1 }),
  }),
  getAdminSupportTicketSummaryQueryKey: () => [
    { _id: 'getAdminSupportTicketSummary' },
  ],
  listAdminSupportTicketsOptions: (options: unknown) => ({
    queryKey: ['support-ticket-list', options],
    queryFn: () => api.list(options),
  }),
  listAdminSupportTicketsQueryKey: () => [{ _id: 'listAdminSupportTickets' }],
  getAdminSupportTicketOptions: (options: unknown) => ({
    queryKey: ['support-ticket-detail', options],
    queryFn: () => api.detail(options),
  }),
  getAdminSupportTicketQueryKey: (options: unknown) => [
    {
      _id: 'getAdminSupportTicket',
      ...(options as Record<string, unknown>),
    },
  ],
  markAdminSupportTicketReadMutation: () => ({ mutationFn: api.markRead }),
  createAdminSupportMessageMutation: () => ({
    mutationFn: vi.fn(),
  }),
  resolveAdminSupportTicketMutation: () => ({
    mutationFn: vi.fn(),
  }),
  getApiV1AdminAuditLogQueryKey: () => [{ _id: 'getApiV1AdminAuditLog' }],
}))

const ticketId = '11111111-1111-4111-8111-111111111111'
const salonId = '22222222-2222-4222-8222-222222222222'
const item = {
  id: ticketId,
  salonId,
  salonName: 'سالن آفتاب',
  submittedByUserId: '33333333-3333-4333-8333-333333333333',
  submittedByDisplayName: 'مینا احمدی',
  category: 'problem' as const,
  subject: 'مشکل در رزرو',
  status: 'open' as const,
  lastActivityAt: '2026-06-20T10:00:00.000Z',
  createdAt: '2026-06-20T09:00:00.000Z',
  platformHasUnread: true,
  lastMessage: {
    body: 'رزرو ثبت نمی‌شود',
    authorKind: 'manager' as const,
    authorDisplayName: 'مینا احمدی',
  },
}

describe('admin Support Ticket inbox', () => {
  beforeEach(() => {
    api.list.mockReset()
    api.detail.mockReset()
    api.markRead.mockReset()
    api.auth.mockResolvedValue({
      user: {
        userId: 'admin-real-id',
        name: 'ادمین واقعی',
        email: 'admin@saluna.test',
        phoneNumber: null,
        username: 'admin',
        role: 'platform_admin',
        active: true,
      },
      runtime: { dataSource: 'local' },
    })
    api.list.mockResolvedValue({
      items: [item],
      pagination: { page: 1, pageSize: 20, total: 21 },
    })
    api.detail.mockResolvedValue({
      ticket: {
        ...item,
        resolvedAt: null,
        resolvedByUserId: null,
      },
      platformHasUnread: true,
      messages: [],
      truncated: false,
    })
    api.markRead.mockResolvedValue({
      ticketId,
      readAt: '2026-06-20T11:00:00.000Z',
    })
  })

  afterEach(cleanup)

  it('debounces search, pushes filters and pagination, and renders unread and salon links', async () => {
    const { router } = await renderAdminRoute('/support-tickets')

    expect(await screen.findByText('مشکل در رزرو')).toBeTruthy()
    expect(screen.getByLabelText('خوانده‌نشده')).toBeTruthy()
    const detailLink = screen.getByRole('link', { name: 'مشاهده جزئیات' })
    expect(detailLink.getAttribute('href')).toContain(ticketId)
    const salonLink = screen.getByRole('link', { name: 'سالن آفتاب' })
    expect(salonLink.getAttribute('href')).toBe(`/salons/${salonId}`)
    expect(salonLink.querySelector('a')).toBeNull()

    fireEvent.change(screen.getByPlaceholderText('موضوع یا نام سالن...'), {
      target: { value: ' آفتاب ' },
    })
    await waitFor(
      () =>
        expect(api.list).toHaveBeenCalledWith({
          query: expect.objectContaining({ search: 'آفتاب', page: 1 }),
        }),
      { timeout: 1_000 },
    )

    fireEvent.click(screen.getByRole('combobox', { name: 'دسته‌بندی' }))
    fireEvent.click(
      await screen.findByRole('option', {
        name: supportTicketCategoryLabels.question,
      }),
    )
    await waitFor(() =>
      expect(locationSearch(router)).toContain('category=question'),
    )
    expect(await screen.findByText('مشکل در رزرو')).toBeTruthy()
    fireEvent.click(await screen.findByRole('button', { name: 'بعدی' }))
    await waitFor(() => expect(locationSearch(router)).toContain('page=2'))
  })

  it('preserves every inbox search parameter through detail and the return link', async () => {
    const { router } = await renderAdminRoute(
      `/support-tickets?page=2&search=رزرو&status=open&category=problem&salon=${salonId}&scope=all`,
    )

    const subjectLink = await screen.findByRole('link', {
      name: 'مشکل در رزرو',
    })
    fireEvent.click(subjectLink)
    await screen.findByText('بازگشت به صندوق')
    expect(locationSearch(router)).toContain('page=2')
    expect(locationSearch(router)).toContain('search=')
    expect(locationSearch(router)).toContain(`salon=${salonId}`)

    fireEvent.click(screen.getByRole('link', { name: 'بازگشت به صندوق' }))
    await screen.findByText('مشکل در رزرو')
    expect(router.state.location.pathname).toBe('/support-tickets')
    expect(locationSearch(router)).toContain('page=2')
    expect(locationSearch(router)).toContain('scope=all')
  })

  it('renders loading, error with retry, and empty states', async () => {
    api.list.mockReturnValueOnce(new Promise(() => undefined))
    const loading = await renderAdminRoute('/support-tickets')
    expect(screen.getByLabelText('در حال بارگذاری تیکت‌ها')).toBeTruthy()
    loading.unmount()

    api.list.mockRejectedValueOnce(new Error('network'))
    const failed = await renderAdminRoute('/support-tickets')
    expect(
      await screen.findByText('بارگذاری تیکت‌های پشتیبانی ناموفق بود.'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'تلاش مجدد' })).toBeTruthy()
    failed.unmount()

    api.list.mockResolvedValueOnce({
      items: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
    })
    await renderAdminRoute('/support-tickets')
    expect(await screen.findByText('تیکتی در این نما نیست')).toBeTruthy()
  })
})
