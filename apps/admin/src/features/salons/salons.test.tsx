import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { AdminAuthProvider } from '#/context/admin-auth-provider'

import { SalonDetailScreen, SalonsListScreen } from './index'

const generated = vi.hoisted(() => ({
  listSalons: vi.fn(),
  getSalon: vi.fn(),
  getNotes: vi.fn(),
  getClients: vi.fn(),
  getAppointments: vi.fn(),
  getAppointmentRequests: vi.fn(),
  getStaff: vi.fn(),
  getServices: vi.fn(),
  patchStatus: vi.fn(),
  postNote: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    params,
    children,
  }: {
    to: string
    params?: Record<string, string>
    children: ReactNode
  }) => {
    const href = params?.salonId ? to.replace('$salonId', params.salonId) : to
    return <a href={href}>{children}</a>
  },
}))

vi.mock('@repo/api-client/query', () => ({
  getApiV1AdminOverviewQueryKey: () => [{ _id: 'overview' }],
  getApiV1AdminSalonsQueryKey: () => [{ _id: 'salons' }],
  getApiV1AdminSalonsByIdQueryKey: (options: unknown) => [
    { _id: 'salon-detail', options },
  ],
  getApiV1AdminSalonsByIdNotesQueryKey: (options: unknown) => [
    { _id: 'salon-notes', options },
  ],
  getApiV1AdminSalonsOptions: (options: unknown) => ({
    queryKey: ['salons', options],
    queryFn: () => generated.listSalons(options),
  }),
  getApiV1AdminSalonsByIdOptions: (options: unknown) => ({
    queryKey: ['salon-detail', options],
    queryFn: () => generated.getSalon(options),
  }),
  getApiV1AdminSalonsByIdNotesOptions: (options: unknown) => ({
    queryKey: ['salon-notes', options],
    queryFn: () => generated.getNotes(options),
  }),
  getApiV1AdminSalonsByIdClientsOptions: (options: unknown) => ({
    queryKey: ['salon-clients', options],
    queryFn: () => generated.getClients(options),
  }),
  getApiV1AdminSalonsByIdAppointmentsOptions: (options: unknown) => ({
    queryKey: ['salon-appointments', options],
    queryFn: () => generated.getAppointments(options),
  }),
  getApiV1AdminSalonsByIdAppointmentRequestsOptions: (options: unknown) => ({
    queryKey: ['salon-appointment-requests', options],
    queryFn: () => generated.getAppointmentRequests(options),
  }),
  getApiV1AdminSalonsByIdStaffOptions: (options: unknown) => ({
    queryKey: ['salon-staff', options],
    queryFn: () => generated.getStaff(options),
  }),
  getApiV1AdminSalonsByIdServicesOptions: (options: unknown) => ({
    queryKey: ['salon-services', options],
    queryFn: () => generated.getServices(options),
  }),
  patchApiV1AdminSalonsByIdStatusMutation: () => ({
    mutationFn: generated.patchStatus,
  }),
  postApiV1AdminSalonsByIdNotesMutation: () => ({
    mutationFn: generated.postNote,
  }),
}))

function renderWithProviders(
  children: ReactNode,
  options: { dataSource?: 'local' | 'live' } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider
        me={{
          id: 'admin-user-id',
          userId: 'admin-user-id',
          name: 'Platform Owner',
          email: 'owner@saluna.test',
          phoneNumber: '+989120000000',
          username: 'owner',
          role: 'platform_owner',
          active: true,
        }}
        runtime={{ dataSource: options.dataSource ?? 'local' }}
      >
        {children}
      </AdminAuthProvider>
    </QueryClientProvider>,
  )
}

const salonId = '11111111-1111-4111-8111-111111111111'

describe('salons feature', () => {
  beforeEach(() => {
    generated.listSalons.mockReset()
    generated.getSalon.mockReset()
    generated.getNotes.mockReset()
    generated.getClients.mockReset()
    generated.getAppointments.mockReset()
    generated.getAppointmentRequests.mockReset()
    generated.getStaff.mockReset()
    generated.getServices.mockReset()
    generated.patchStatus.mockReset()
    generated.postNote.mockReset()
    generated.getClients.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 10, total: 0 },
    })
    generated.getAppointments.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 10, total: 0 },
    })
    generated.getAppointmentRequests.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 10, total: 0 },
    })
    generated.getStaff.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 10, total: 0 },
    })
    generated.getServices.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 10, total: 0 },
    })
    window.history.replaceState(null, '', '/salons')
  })

  afterEach(() => {
    cleanup()
  })

  it('renders a searchable paginated salon table from generated salon query options', async () => {
    generated.listSalons.mockResolvedValue({
      items: [
        {
          id: salonId,
          name: 'سالن آفتاب',
          slug: 'aftab',
          status: 'active',
          phone: '+989121234567',
          memberCount: 3,
          publicEnabled: true,
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1 },
    })

    renderWithProviders(<SalonsListScreen />)

    expect(await screen.findByText('سالن آفتاب')).toBeTruthy()
    expect(screen.getByText('aftab')).toBeTruthy()
    expect(screen.getByText('فعال')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: /مشاهده/ }).getAttribute('href'),
    ).toBe('/salons/11111111-1111-4111-8111-111111111111')
    expect(generated.listSalons).toHaveBeenCalledWith({
      query: { page: 1, pageSize: 20, search: undefined },
    })
  })

  it('renders salon overview detail and submits a live-data status change with reason and confirmation', async () => {
    generated.getSalon.mockResolvedValue({
      salon: {
        id: salonId,
        name: 'سالن آفتاب',
        slug: 'aftab',
        status: 'active',
        phone: '+989121234567',
        timezone: 'Asia/Tehran',
        publicEnabled: true,
      },
      members: [{ name: 'مریم', role: 'owner', phoneNumber: '+989120000000' }],
      stats: { services: 9, appointments: 12 },
    })
    generated.getNotes.mockResolvedValue({ notes: [] })
    generated.patchStatus.mockResolvedValue({ salon: { id: salonId } })

    renderWithProviders(<SalonDetailScreen salonId={salonId} />, {
      dataSource: 'live',
    })

    expect(await screen.findByText('سالن آفتاب')).toBeTruthy()
    expect(screen.getByText('Overview')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /^تغییر وضعیت$/ }))
    expect(
      screen.getByText(/تغییر وضعیت سالن روی داده زنده تولید اعمال می‌شود/),
    ).toBeTruthy()

    fireEvent.change(screen.getByLabelText('وضعیت'), {
      target: { value: 'suspended' },
    })
    fireEvent.change(screen.getByLabelText('دلیل'), {
      target: { value: 'بررسی تخلف' },
    })
    fireEvent.change(screen.getByLabelText('تأیید داده زنده'), {
      target: { value: 'LIVE' },
    })
    fireEvent.click(screen.getByRole('button', { name: /به‌روزرسانی وضعیت/ }))

    await waitFor(() => {
      expect(generated.patchStatus).toHaveBeenCalled()
    })
    expect(generated.patchStatus.mock.calls[0]?.[0]).toEqual({
      path: { id: salonId },
      body: {
        status: 'suspended',
        reason: 'بررسی تخلف',
        liveConfirmation: 'LIVE',
      },
    })
  })

  it('lists and creates internal salon notes with a required reason', async () => {
    generated.getSalon.mockResolvedValue({
      salon: { id: salonId, name: 'سالن آفتاب', status: 'active' },
      members: [],
      stats: { services: 0, appointments: 0 },
    })
    generated.getNotes.mockResolvedValue({
      notes: [
        {
          id: 'note-1',
          subjectType: 'salon',
          subjectId: salonId,
          body: 'نیاز به پیگیری',
          authorUserId: 'admin-user-id',
          authorName: 'ادمین',
          createdAt: '2026-06-18T10:30:00.000Z',
        },
      ],
    })
    generated.postNote.mockResolvedValue({ note: { id: 'note-2' } })

    renderWithProviders(<SalonDetailScreen salonId={salonId} />)

    expect(await screen.findByText('نیاز به پیگیری')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('یادداشت'), {
      target: { value: 'تماس دوباره با مالک' },
    })
    fireEvent.change(screen.getByPlaceholderText('دلیل الزامی برای ممیزی'), {
      target: { value: 'ثبت پیگیری داخلی' },
    })
    fireEvent.click(screen.getByRole('button', { name: /افزودن یادداشت/ }))

    await waitFor(() => {
      expect(generated.postNote).toHaveBeenCalled()
    })
    expect(generated.postNote.mock.calls[0]?.[0]).toEqual({
      path: { id: salonId },
      body: {
        body: 'تماس دوباره با مالک',
        reason: 'ثبت پیگیری داخلی',
      },
    })
  })

  it('renders read-only salon tenant data tabs with populated and empty states', async () => {
    generated.getSalon.mockResolvedValue({
      salon: { id: salonId, name: 'سالن آفتاب', status: 'active' },
      members: [],
      stats: { services: 1, appointments: 0, appointmentRequests: 0 },
    })
    generated.getNotes.mockResolvedValue({ notes: [] })
    generated.getClients.mockResolvedValue({
      items: [
        {
          id: 'client-1',
          name: 'Client One',
          phone: '+989121111111',
          isPlaceholder: false,
          notes: 'VIP',
          createdAt: '2026-06-18T10:30:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 10, total: 1 },
    })
    generated.getServices.mockResolvedValue({
      items: [
        {
          id: 'service-1',
          name: 'ServiceVariant Cut',
          kind: 'standard',
          categoryName: 'Hair',
          familyName: 'Cut',
          duration: 45,
          price: 500000,
          active: true,
        },
      ],
      pagination: { page: 1, pageSize: 10, total: 1 },
    })

    renderWithProviders(<SalonDetailScreen salonId={salonId} />)

    expect(await screen.findByText('Client One')).toBeTruthy()
    expect(screen.queryByText(/افزودن Client/)).toBeNull()
    expect(generated.getClients).toHaveBeenCalledWith({
      path: { id: salonId },
      query: { page: 1, pageSize: 10, search: undefined },
    })

    fireEvent.pointerDown(screen.getByRole('tab', { name: 'Appointments' }))
    await waitFor(() => {
      expect(generated.getAppointments).toHaveBeenCalled()
    })
    expect(generated.getAppointments.mock.calls[0]?.[0]).toEqual({
      path: { id: salonId },
      query: { page: 1, pageSize: 10, search: undefined },
    })
    expect(screen.queryByText(/افزودن Appointment/)).toBeNull()

    fireEvent.pointerDown(screen.getByRole('tab', { name: 'ServiceVariants' }))
    await waitFor(() => {
      expect(generated.getServices).toHaveBeenCalled()
    })
    expect(screen.queryByText(/افزودن ServiceVariant/)).toBeNull()
  })
})
