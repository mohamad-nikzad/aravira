import { describe, it, expect, vi } from 'vitest'
import { createDataClient } from './create-data-client'
import type { HttpTransportPort } from './ports/http-transport'
import { DataClientHttpError } from './ports/http-transport'
import type { AppointmentWithDetails, Client, Service, User } from '@repo/salon-core'

function mockUser(id: string): User {
  return {
    id,
    salonId: 's1',
    name: 'Test',
    role: 'manager',
    color: 'bg-staff-1',
    phone: '09120000000',
    createdAt: new Date(),
  }
}

describe('createDataClient', () => {
  it('uses HTTP on every read when persistence is online-only', async () => {
    const transport = {
      json: vi.fn(async () => ({ staff: [mockUser('u1')] })),
    } as unknown as HttpTransportPort

    const client = createDataClient({ persistence: 'online-only', transport })
    await client.staff.list()
    await client.staff.list()
    expect(transport.json).toHaveBeenCalledTimes(2)
  })

  it('serves staff list from memory cache after first fetch', async () => {
    const transport = {
      json: vi.fn(async () => ({ staff: [mockUser('u1')] })),
    } as unknown as HttpTransportPort

    const client = createDataClient({ persistence: 'memory', transport })
    await client.staff.list()
    await client.staff.list()
    expect(transport.json).toHaveBeenCalledTimes(1)
  })

  it('persists staff list across two clients with indexeddb persistence', async () => {
    const transport = {
      json: vi.fn(async () => ({ staff: [mockUser('idb-1')] })),
    } as unknown as HttpTransportPort

    const dbName = `dc-test-${Math.random().toString(36).slice(2)}`
    const a = createDataClient({
      persistence: 'indexeddb',
      indexedDb: { databaseName: dbName },
      transport,
    })
    await a.staff.list()
    expect(transport.json).toHaveBeenCalledTimes(1)

    const b = createDataClient({
      persistence: 'indexeddb',
      indexedDb: { databaseName: dbName },
      transport,
    })
    await b.staff.list()
    expect(transport.json).toHaveBeenCalledTimes(1)
  })

  it('can update a range-hydrated appointment while offline', async () => {
    const transport = {
      json: vi.fn(async () => {
        throw new Error('network should not be used')
      }),
    } as unknown as HttpTransportPort
    const staff = { ...mockUser('staff-1'), role: 'staff' as const }
    const service: Service = {
      id: 'service-1',
      name: 'Cut',
      category: 'hair',
      duration: 30,
      price: 100,
      color: 'bg-staff-1',
      active: true,
    }
    const salonClient: Client = {
      id: 'client-1',
      name: 'Client',
      phone: '09120000000',
      isPlaceholder: false,
      createdAt: new Date(),
    }
    const appointment: AppointmentWithDetails = {
      id: 'appointment-1',
      clientId: salonClient.id,
      staffId: staff.id,
      serviceId: service.id,
      date: '2026-04-27',
      startTime: '10:00',
      endTime: '10:30',
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
      client: salonClient,
      staff,
      service,
    }

    const client = createDataClient({
      persistence: 'memory',
      transport,
      isOnline: () => false,
    })
    await client.staff.hydrateFromServer([staff])
    await client.services.hydrateFromServer([service])
    await client.clients.hydrateListFromServer([salonClient])
    await client.appointments.hydrateRangeFromServer('2026-04-27', '2026-04-27', [appointment])

    const updated = await client.appointments.updateStatus(appointment.id, 'confirmed')
    const state = await client.sync.getState()

    expect(updated).toMatchObject({
      type: 'updated',
      appointment: expect.objectContaining({ status: 'confirmed' }),
    })
    expect(state.pendingCount).toBe(1)
    expect(transport.json).not.toHaveBeenCalled()
  })

  it('can create a placeholder appointment while offline', async () => {
    const transport = {
      json: vi.fn(async () => {
        throw new Error('network should not be used')
      }),
    } as unknown as HttpTransportPort
    const staff = { ...mockUser('staff-1'), role: 'staff' as const }
    const service: Service = {
      id: 'service-1',
      name: 'Cut',
      category: 'hair',
      duration: 30,
      price: 100,
      color: 'bg-staff-1',
      active: true,
    }

    const client = createDataClient({
      persistence: 'memory',
      transport,
      isOnline: () => false,
    })
    await client.staff.hydrateFromServer([staff])
    await client.services.hydrateFromServer([service])

    const created = await client.appointments.create({
      placeholderClient: {
        name: 'دوست سارا',
        notes: 'شماره را بعداً می‌گیرم',
      },
      staffId: staff.id,
      serviceId: service.id,
      date: '2026-04-27',
      startTime: '10:00',
    })
    const state = await client.sync.getState()

    expect(created.client.isPlaceholder).toBe(true)
    expect(created.client.phone).toBeNull()
    expect(state.pendingCount).toBe(1)
    expect(transport.json).not.toHaveBeenCalledWith(
      'POST',
      '/api/appointments',
      expect.anything()
    )
  })

  it('can complete a placeholder appointment while offline', async () => {
    const transport = {
      json: vi.fn(async () => {
        throw new Error('network should not be used')
      }),
    } as unknown as HttpTransportPort
    const staff = { ...mockUser('staff-1'), role: 'staff' as const }
    const service: Service = {
      id: 'service-1',
      name: 'Cut',
      category: 'hair',
      duration: 30,
      price: 100,
      color: 'bg-staff-1',
      active: true,
    }

    const client = createDataClient({
      persistence: 'memory',
      transport,
      isOnline: () => false,
    })
    await client.staff.hydrateFromServer([staff])
    await client.services.hydrateFromServer([service])

    const created = await client.appointments.create({
      placeholderClient: { name: 'دوست سارا' },
      staffId: staff.id,
      serviceId: service.id,
      date: '2026-04-27',
      startTime: '10:00',
    })

    const completed = await client.appointments.completePlaceholderClient(created.id, {
      name: 'سارا',
      phone: '۰۹۱۲ ۱۱۱ ۱۱۱۱',
      notes: 'تکمیل شد',
    })
    const state = await client.sync.getState()

    expect(completed.client.isPlaceholder).toBe(false)
    expect(completed.client.phone).toBe('09121111111')
    expect(state.pendingCount).toBe(2)
    expect(transport.json).not.toHaveBeenCalledWith(
      'POST',
      expect.stringContaining('/complete-client'),
      expect.anything()
    )
  })

  it('removes incomplete placeholder appointments locally when cancelled offline', async () => {
    const transport = {
      json: vi.fn(async () => {
        throw new Error('network should not be used')
      }),
    } as unknown as HttpTransportPort
    const staff = { ...mockUser('staff-1'), role: 'staff' as const }
    const service: Service = {
      id: 'service-1',
      name: 'Cut',
      category: 'hair',
      duration: 30,
      price: 100,
      color: 'bg-staff-1',
      active: true,
    }

    const client = createDataClient({
      persistence: 'memory',
      transport,
      isOnline: () => false,
    })
    await client.staff.hydrateFromServer([staff])
    await client.services.hydrateFromServer([service])

    const created = await client.appointments.create({
      placeholderClient: { name: 'دوست سارا' },
      staffId: staff.id,
      serviceId: service.id,
      date: '2026-04-27',
      startTime: '10:00',
    })

    const cancelled = await client.appointments.updateStatus(created.id, 'cancelled')
    const appointmentAfter = await client.appointments.getById(created.id)
    const syncState = await client.sync.getState()

    expect(cancelled).toEqual({ type: 'deleted', id: created.id })
    expect(appointmentAfter).toBeNull()
    expect(syncState.pendingCount).toBe(0)
  })

  it('replays offline placeholder cancellation through cleanup PATCH semantics', async () => {
    let online = false
    const transport = {
      json: vi.fn(async (method, path, options) => {
        if (method === 'PATCH' && path === '/api/appointments/appointment-1') {
          return {
            success: true,
            removedAppointmentId: 'appointment-1',
            cleanup: true,
          }
        }
        throw new Error(`unexpected request: ${method} ${path} ${JSON.stringify(options?.body ?? {})}`)
      }),
    } as unknown as HttpTransportPort
    const staff = { ...mockUser('staff-1'), role: 'staff' as const }
    const service: Service = {
      id: 'service-1',
      name: 'Cut',
      category: 'hair',
      duration: 30,
      price: 100,
      color: 'bg-staff-1',
      active: true,
    }
    const placeholderClient: Client = {
      id: 'placeholder-1',
      name: 'دوست سارا',
      phone: null,
      isPlaceholder: true,
      createdAt: new Date(),
    }
    const appointment: AppointmentWithDetails = {
      id: 'appointment-1',
      clientId: placeholderClient.id,
      staffId: staff.id,
      serviceId: service.id,
      date: '2026-04-27',
      startTime: '10:00',
      endTime: '10:30',
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
      client: placeholderClient,
      staff,
      service,
    }

    const client = createDataClient({
      persistence: 'memory',
      transport,
      isOnline: () => online,
    })
    await client.staff.hydrateFromServer([staff])
    await client.services.hydrateFromServer([service])
    await client.appointments.hydrateRangeFromServer('2026-04-27', '2026-04-27', [appointment])

    const cancelled = await client.appointments.updateStatus(appointment.id, 'cancelled')
    expect(cancelled).toEqual({ type: 'deleted', id: appointment.id })
    expect(await client.appointments.getById(appointment.id)).toBeNull()
    expect((await client.sync.getState()).pendingCount).toBe(1)

    online = true
    await client.sync.processPending()

    expect(transport.json).toHaveBeenCalledWith('PATCH', '/api/appointments/appointment-1', {
      body: { status: 'cancelled' },
    })
    expect((await client.sync.getState()).pendingCount).toBe(0)
  })

  it('builds placeholder-specific review metadata for offline duplicate-phone conflicts', async () => {
    let online = false
    let createdAppointment: AppointmentWithDetails | null = null
    const transport = {
      json: vi.fn(async (method, path) => {
        if (method === 'POST' && path === '/api/appointments' && createdAppointment) {
          return { appointment: createdAppointment }
        }
        if (method === 'POST' && path.endsWith('/complete-client')) {
          throw new DataClientHttpError('duplicate phone', 409, { code: 'duplicate-phone' })
        }
        throw new Error(`unexpected request: ${method} ${path}`)
      }),
    } as unknown as HttpTransportPort
    const staff = { ...mockUser('staff-1'), role: 'staff' as const }
    const service: Service = {
      id: 'service-1',
      name: 'Cut',
      category: 'hair',
      duration: 30,
      price: 100,
      color: 'bg-staff-1',
      active: true,
    }

    const client = createDataClient({
      persistence: 'memory',
      transport,
      isOnline: () => online,
    })
    await client.staff.hydrateFromServer([staff])
    await client.services.hydrateFromServer([service])

    const created = await client.appointments.create({
      placeholderClient: { name: 'دوست سارا' },
      staffId: staff.id,
      serviceId: service.id,
      date: '2026-04-27',
      startTime: '10:00',
    })
    createdAppointment = created

    await client.clients.hydrateListFromServer([
      {
        id: 'client-existing',
        name: 'سارا',
        phone: '09121111111',
        isPlaceholder: false,
        createdAt: new Date(),
      },
    ])

    await client.appointments.completePlaceholderClient(created.id, {
      name: 'سارا',
      phone: '09121111111',
      notes: 'از صف آفلاین',
      reassignToExistingClientId: 'client-existing',
    })
    online = true
    await client.sync.processPending()

    const reviewItems = await client.sync.listReviewItems()

    expect(reviewItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'تکمیل اطلاعات مشتری موقت',
          conflictCode: 'duplicate-phone',
          href: `/calendar?date=${created.date}&appointmentId=${created.id}`,
          actionLabel: 'باز کردن نوبت در تقویم',
        }),
      ])
    )
    expect(reviewItems[0]?.description).toContain('انتقال به مشتری موجود')
  })

  it('builds placeholder-specific review metadata for offline placeholder reuse conflicts', async () => {
    let online = false
    const transport = {
      json: vi.fn(async (method, path) => {
        if (method === 'PATCH' && path === '/api/appointments/appointment-2') {
          throw new DataClientHttpError('placeholder reuse', 409, { code: 'placeholder-reuse' })
        }
        throw new Error(`unexpected request: ${method} ${path}`)
      }),
    } as unknown as HttpTransportPort
    const staff = { ...mockUser('staff-1'), role: 'staff' as const }
    const service: Service = {
      id: 'service-1',
      name: 'Cut',
      category: 'hair',
      duration: 30,
      price: 100,
      color: 'bg-staff-1',
      active: true,
    }
    const placeholderClient: Client = {
      id: 'placeholder-1',
      name: 'دوست سارا',
      phone: null,
      isPlaceholder: true,
      createdAt: new Date(),
    }
    const secondAppointment: AppointmentWithDetails = {
      id: 'appointment-2',
      clientId: 'client-2',
      staffId: staff.id,
      serviceId: service.id,
      date: '2026-04-27',
      startTime: '11:00',
      endTime: '11:30',
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
      client: {
        id: 'client-2',
        name: 'مشتری دوم',
        phone: '09120000020',
        isPlaceholder: false,
        createdAt: new Date(),
      },
      staff,
      service,
    }

    const client = createDataClient({
      persistence: 'memory',
      transport,
      isOnline: () => online,
    })
    await client.staff.hydrateFromServer([staff])
    await client.services.hydrateFromServer([service])
    await client.clients.hydrateListFromServer([placeholderClient, secondAppointment.client])
    await client.appointments.hydrateRangeFromServer('2026-04-27', '2026-04-27', [secondAppointment])

    await client.appointments.update(secondAppointment.id, { clientId: placeholderClient.id })
    online = true
    await client.sync.processPending()

    const reviewItems = await client.sync.listReviewItems()

    expect(reviewItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          conflictCode: 'placeholder-reuse',
          href: `/calendar?date=${secondAppointment.date}&appointmentId=${secondAppointment.id}`,
          actionLabel: 'بررسی نوبت در تقویم',
        }),
      ])
    )
    expect(reviewItems[0]?.description).toContain('مشتری موقت تازه')
  })
})
