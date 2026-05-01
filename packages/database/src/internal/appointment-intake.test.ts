import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validateCreateAppointmentIntake, validateUpdateAppointmentIntake } from './appointment-intake'

const mocks = vi.hoisted(() => ({
  getClientById: vi.fn(),
  getServiceById: vi.fn(),
  staffMayPerformService: vi.fn(),
  getUserById: vi.fn(),
  checkStaffAvailabilityForAppointment: vi.fn(),
  getScheduleOverlapFlags: vi.fn(),
  validatePlaceholderClientUsage: vi.fn(),
}))

vi.mock('./client-queries', () => ({
  getClientById: mocks.getClientById,
  isClientProvidedEntityId: (id: string | undefined) => typeof id === 'string',
}))

vi.mock('./service-queries', () => ({
  getServiceById: mocks.getServiceById,
}))

vi.mock('./staff-queries', () => ({
  checkStaffAvailabilityForAppointment: mocks.checkStaffAvailabilityForAppointment,
  staffMayPerformService: mocks.staffMayPerformService,
}))

vi.mock('./user-queries', () => ({
  getUserById: mocks.getUserById,
}))

vi.mock('./appointment-queries', () => ({
  getScheduleOverlapFlags: mocks.getScheduleOverlapFlags,
}))

vi.mock('./placeholder-client-queries', () => ({
  validatePlaceholderClientUsage: mocks.validatePlaceholderClientUsage,
}))

describe('appointment intake placeholder rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getClientById.mockResolvedValue({
      id: 'placeholder-1',
      name: 'دوست سارا',
      phone: null,
      isPlaceholder: true,
      createdAt: new Date(),
    })
    mocks.getServiceById.mockResolvedValue({
      id: 'service-1',
      name: 'کات',
      active: true,
      duration: 45,
    })
    mocks.staffMayPerformService.mockResolvedValue(true)
    mocks.getUserById.mockResolvedValue({
      id: 'staff-1',
      salonId: 'salon-1',
      role: 'staff',
      name: 'پرسنل',
      color: 'bg-staff-1',
      phone: '09120000000',
      createdAt: new Date(),
    })
    mocks.checkStaffAvailabilityForAppointment.mockResolvedValue({ ok: true })
    mocks.getScheduleOverlapFlags.mockResolvedValue({
      staffConflict: false,
      clientConflict: false,
    })
    mocks.validatePlaceholderClientUsage.mockResolvedValue({
      ok: true,
      client: {
        id: 'placeholder-1',
        name: 'دوست سارا',
        phone: null,
        isPlaceholder: true,
        createdAt: new Date(),
      },
    })
  })

  it('rejects creating a second appointment with the same placeholder client', async () => {
    mocks.validatePlaceholderClientUsage.mockResolvedValue({
      ok: false,
      status: 409,
      error: 'این مشتری موقت قبلاً به نوبت دیگری وصل شده است',
      code: 'placeholder-reuse',
    })

    const result = await validateCreateAppointmentIntake({
      salonId: 'salon-1',
      clientId: 'placeholder-1',
      staffId: 'staff-1',
      serviceId: 'service-1',
      date: '2026-05-01',
      startTime: '10:00',
    })

    expect(result).toMatchObject({
      ok: false,
      status: 409,
      code: 'placeholder-reuse',
    })
    expect(mocks.validatePlaceholderClientUsage).toHaveBeenCalledWith({
      salonId: 'salon-1',
      clientId: 'placeholder-1',
    })
  })

  it('allows editing the same appointment without tripping placeholder reuse', async () => {
    const result = await validateUpdateAppointmentIntake({
      salonId: 'salon-1',
      appointmentId: 'appointment-1',
      existing: {
        id: 'appointment-1',
        clientId: 'placeholder-1',
        staffId: 'staff-1',
        serviceId: 'service-1',
        date: '2026-05-01',
        startTime: '10:00',
        endTime: '10:45',
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      body: {
        notes: 'ویرایش شد',
      },
    })

    expect(result).toMatchObject({
      ok: true,
      patch: {
        endTime: '10:45',
        notes: 'ویرایش شد',
      },
    })
    expect(mocks.validatePlaceholderClientUsage).toHaveBeenCalledWith({
      salonId: 'salon-1',
      clientId: 'placeholder-1',
      appointmentId: 'appointment-1',
    })
  })
})
