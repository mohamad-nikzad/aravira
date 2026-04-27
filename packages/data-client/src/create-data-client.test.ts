import { describe, it, expect, vi } from 'vitest'
import { createDataClient } from './create-data-client'
import type { HttpTransportPort } from './ports/http-transport'
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

    expect(updated.status).toBe('confirmed')
    expect(state.pendingCount).toBe(1)
    expect(transport.json).not.toHaveBeenCalled()
  })
})
