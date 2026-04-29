import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET as listClients, POST as createClientRoute } from '@/app/api/clients/route'
import { PATCH as updateClientRoute } from '@/app/api/clients/[id]/route'
import { PATCH as updateServiceRoute } from '@/app/api/services/[id]/route'
import {
  DELETE as deleteAppointmentRoute,
  GET as getAppointmentRoute,
} from '@/app/api/appointments/[id]/route'
import { GET as listAppointments, POST as createAppointmentRoute } from '@/app/api/appointments/route'

const mocks = vi.hoisted(() => ({
  getTenantUser: vi.fn(),
  getTenantRequest: vi.fn(),
  getTenantManagerRequest: vi.fn(),
  getAllClients: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  updateService: vi.fn(),
  getAppointmentsWithDetailsByDateRange: vi.fn(),
  createAppointment: vi.fn(),
  getAppointmentById: vi.fn(),
  getAppointmentWithDetailsById: vi.fn(),
  deleteAppointment: vi.fn(),
  getClientById: vi.fn(),
  getUserById: vi.fn(),
  getServiceById: vi.fn(),
  validateCreateAppointmentIntake: vi.fn(),
  validateUpdateAppointmentIntake: vi.fn(),
  sendWebPushToUser: vi.fn(),
  isWebPushConfigured: vi.fn(),
}))

vi.mock('@repo/auth/tenant', () => ({
  getTenantUser: mocks.getTenantUser,
  getTenantRequest: mocks.getTenantRequest,
  getTenantManagerRequest: mocks.getTenantManagerRequest,
  isManagerRole: (role: string) => role === 'manager',
}))

function isClientProvidedEntityId(id: string | undefined): id is string {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  )
}

vi.mock('@repo/database/clients', () => ({
  getAllClients: mocks.getAllClients,
  createClient: mocks.createClient,
  updateClient: mocks.updateClient,
  getClientById: mocks.getClientById,
  isClientProvidedEntityId,
}))

vi.mock('@repo/database/services', () => ({
  updateService: mocks.updateService,
  getServiceById: mocks.getServiceById,
}))

vi.mock('@repo/database/appointments', () => ({
  getAppointmentsWithDetailsByDateRange: mocks.getAppointmentsWithDetailsByDateRange,
  createAppointment: mocks.createAppointment,
  getAppointmentById: mocks.getAppointmentById,
  getAppointmentWithDetailsById: mocks.getAppointmentWithDetailsById,
  deleteAppointment: mocks.deleteAppointment,
  getClientById: mocks.getClientById,
  getUserById: mocks.getUserById,
  getServiceById: mocks.getServiceById,
  validateCreateAppointmentIntake: mocks.validateCreateAppointmentIntake,
  validateUpdateAppointmentIntake: mocks.validateUpdateAppointmentIntake,
}))

vi.mock('@/lib/push', () => ({
  sendWebPushToUser: mocks.sendWebPushToUser,
  isWebPushConfigured: mocks.isWebPushConfigured,
}))

const salonManager = {
  userId: 'manager-a',
  salonId: 'salon-a',
  role: 'manager' as const,
  name: 'Manager A',
  phone: '09120000000',
}

const salonStaff = {
  userId: 'staff-a',
  salonId: 'salon-a',
  role: 'staff' as const,
  name: 'Staff A',
  phone: '09120000001',
}

function jsonRequest(body: unknown, method = 'POST') {
  return new Request('http://test.local/api', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getTenantUser.mockResolvedValue(salonManager)
  mocks.getTenantRequest.mockImplementation(async (permission?: string) => {
    const user = await mocks.getTenantUser()
    if (!user) {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: 'دسترسی غیرمجاز' }), { status: 401 }),
      }
    }
    if (permission && user.role !== 'manager' && permission !== 'view_own_appointments') {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: 'دسترسی غیرمجاز' }), { status: 403 }),
      }
    }
    return { ok: true, user }
  })
  mocks.getTenantManagerRequest.mockImplementation(async () => {
    const user = await mocks.getTenantUser()
    if (!user) {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: 'دسترسی غیرمجاز' }), { status: 401 }),
      }
    }
    if (user.role !== 'manager') {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: 'دسترسی غیرمجاز' }), { status: 403 }),
      }
    }
    return { ok: true, user }
  })
  mocks.isWebPushConfigured.mockReturnValue(false)
  mocks.validateCreateAppointmentIntake.mockResolvedValue({
    ok: true,
    command: {
      clientId: 'client-a',
      staffId: 'staff-a',
      serviceId: 'service-a',
      date: '2026-04-18',
      startTime: '09:00',
      endTime: '09:45',
      status: 'scheduled',
      notes: undefined,
    },
    client: { id: 'client-a', salonId: 'salon-a', name: 'Client A' },
    staff: { id: 'staff-a', salonId: 'salon-a', role: 'staff' },
    service: { id: 'service-a', name: 'Cut', active: true, duration: 45 },
  })
})

describe('tenant isolation route checks', () => {
  it('lists clients only for the authenticated salon', async () => {
    mocks.getAllClients.mockResolvedValue([{ id: 'client-a', name: 'Client A' }])

    const response = await listClients()

    expect(response.status).toBe(200)
    expect(mocks.getAllClients).toHaveBeenCalledWith('salon-a')
    await expect(readJson(response)).resolves.toMatchObject({
      clients: [{ id: 'client-a', name: 'Client A' }],
    })
  })

  it('creates duplicate client phones within the authenticated salon scope only', async () => {
    mocks.createClient.mockResolvedValue({ id: 'client-a', phone: '09121234567' })

    const response = await createClientRoute(
      jsonRequest({ name: 'Shared Phone', phone: '09121234567', salonId: 'salon-b' })
    )

    expect(response.status).toBe(200)
    expect(mocks.createClient).toHaveBeenCalledWith({
      name: 'Shared Phone',
      phone: '09121234567',
      notes: undefined,
      salonId: 'salon-a',
    })
  })

  it('cannot update another salon client by id', async () => {
    mocks.updateClient.mockResolvedValue(undefined)

    const response = await updateClientRoute(
      jsonRequest({ name: 'Blocked' }, 'PATCH'),
      { params: Promise.resolve({ id: 'client-b' }) }
    )

    expect(response.status).toBe(404)
    expect(mocks.updateClient).toHaveBeenCalledWith('client-b', 'salon-a', {
      name: 'Blocked',
      phone: undefined,
      notes: undefined,
    })
  })

  it('cannot update another salon service by id', async () => {
    mocks.updateService.mockResolvedValue(undefined)

    const response = await updateServiceRoute(
      jsonRequest({ name: 'Blocked' }, 'PATCH'),
      { params: Promise.resolve({ id: 'service-b' }) }
    )

    expect(response.status).toBe(404)
    expect(mocks.updateService).toHaveBeenCalledWith('service-b', 'salon-a', {
      name: 'Blocked',
    })
  })

  it('cannot delete another salon appointment by id', async () => {
    mocks.deleteAppointment.mockResolvedValue(false)

    const response = await deleteAppointmentRoute(
      new Request('http://test.local/api/appointments/appointment-b'),
      { params: Promise.resolve({ id: 'appointment-b' }) }
    )

    expect(response.status).toBe(404)
    expect(mocks.deleteAppointment).toHaveBeenCalledWith('appointment-b', 'salon-a')
  })

  it('staff lists only their own appointments in their salon', async () => {
    mocks.getTenantUser.mockResolvedValue(salonStaff)
    mocks.getAppointmentsWithDetailsByDateRange.mockResolvedValue([])

    const response = await listAppointments(
      new Request('http://test.local/api/appointments?startDate=2026-04-01&endDate=2026-04-30')
    )

    expect(response.status).toBe(200)
    expect(mocks.getAppointmentsWithDetailsByDateRange).toHaveBeenCalledWith(
      'salon-a',
      '2026-04-01',
      '2026-04-30',
      'staff-a'
    )
  })

  it('staff cannot view another salon appointment by id', async () => {
    mocks.getTenantUser.mockResolvedValue(salonStaff)
    mocks.getAppointmentWithDetailsById.mockResolvedValue(undefined)

    const response = await getAppointmentRoute(
      new Request('http://test.local/api/appointments/appointment-b'),
      { params: Promise.resolve({ id: 'appointment-b' }) }
    )

    expect(response.status).toBe(404)
    expect(mocks.getAppointmentWithDetailsById).toHaveBeenCalledWith('appointment-b', 'salon-a')
  })

  it('staff cannot view another staff member appointment in the same salon', async () => {
    mocks.getTenantUser.mockResolvedValue(salonStaff)
    mocks.getAppointmentWithDetailsById.mockResolvedValue({
      id: 'appointment-a2',
      staffId: 'staff-a2',
      clientId: 'client-a',
      serviceId: 'service-a',
      date: '2026-04-18',
      startTime: '09:00',
      endTime: '10:00',
      status: 'scheduled',
    })

    const response = await getAppointmentRoute(
      new Request('http://test.local/api/appointments/appointment-a2'),
      { params: Promise.resolve({ id: 'appointment-a2' }) }
    )

    expect(response.status).toBe(403)
  })

  it('checks appointment conflicts inside the authenticated salon only', async () => {
    mocks.createAppointment.mockResolvedValue({
      id: 'appointment-a',
      clientId: 'client-a',
      staffId: 'staff-a',
      serviceId: 'service-a',
      date: '2026-04-18',
      startTime: '09:00',
      endTime: '09:45',
      status: 'scheduled',
    })

    const response = await createAppointmentRoute(
      jsonRequest({
        clientId: 'client-a',
        staffId: 'staff-a',
        serviceId: 'service-a',
        date: '2026-04-18',
        startTime: '09:00',
        salonId: 'salon-b',
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.validateCreateAppointmentIntake).toHaveBeenCalledWith({
      salonId: 'salon-a',
      clientId: 'client-a',
      staffId: 'staff-a',
      serviceId: 'service-a',
      date: '2026-04-18',
      startTime: '09:00',
      endTime: undefined,
      durationMinutes: undefined,
      notes: undefined,
      requestedAppointmentId: undefined,
    })
  })
})
