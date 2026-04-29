import { describe, expect, it } from 'vitest'
import type { Service } from '@repo/salon-core'
import { MemoryLocalDataPort } from '../adapters/memory/memory-local-data-port'
import { KvMutationQueue } from './mutation-queue'

function service(overrides: Partial<Service> = {}): Service {
  return {
    id: 'service-1',
    name: 'Cut',
    category: 'hair',
    duration: 30,
    price: 100,
    color: 'bg-staff-1',
    active: true,
    ...overrides,
  }
}

describe('KvMutationQueue', () => {
  it('compacts business settings patches into one pending row', async () => {
    const queue = new KvMutationQueue(new MemoryLocalDataPort())

    await queue.enqueue({
      entityType: 'business_settings',
      entityId: '__business_settings__',
      operation: 'update',
      payload: { patch: { workingStart: '09:00' } },
    })
    await queue.enqueue({
      entityType: 'business_settings',
      entityId: '__business_settings__',
      operation: 'update',
      payload: { patch: { workingEnd: '18:00' } },
    })

    const rows = await queue.listPending()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.payload).toEqual({
      patch: { workingStart: '09:00', workingEnd: '18:00' },
    })
  })

  it('keeps the latest service overlay when compacting repeated updates', async () => {
    const queue = new KvMutationQueue(new MemoryLocalDataPort())

    await queue.enqueue({
      entityType: 'service',
      entityId: 'service-1',
      operation: 'update',
      payload: {
        id: 'service-1',
        patch: { duration: 45 },
        service: service({ duration: 45 }),
      },
    })
    await queue.enqueue({
      entityType: 'service',
      entityId: 'service-1',
      operation: 'update',
      payload: {
        id: 'service-1',
        patch: { price: 150 },
        service: service({ duration: 45, price: 150 }),
      },
    })

    const rows = await queue.listPending()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.payload).toEqual({
      id: 'service-1',
      patch: { duration: 45, price: 150 },
      service: service({ duration: 45, price: 150 }),
    })
  })
})
