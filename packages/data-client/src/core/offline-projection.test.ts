import { describe, expect, it } from 'vitest'
import { MemoryLocalDataPort } from '../adapters/memory/memory-local-data-port'
import { KvMutationQueue } from './mutation-queue'
import {
  projectListWithPendingEntities,
  projectListWithPendingPatches,
} from './offline-projection'

type Item = { id: string; name: string; tags?: string[] }

describe('offline projection', () => {
  it('overlays pending local entities onto a server list', async () => {
    const storage = new MemoryLocalDataPort()
    const queue = new KvMutationQueue(storage)
    const local: Item = { id: 'local-1', name: 'Local' }
    const updated: Item = { id: 'server-1', name: 'Updated locally' }

    await storage.set('items', 'id:local-1', local)
    await storage.set('items', 'id:server-1', updated)
    await queue.enqueue({
      entityType: 'client',
      entityId: 'local-1',
      operation: 'create',
      payload: { item: local },
    })
    await queue.enqueue({
      entityType: 'client',
      entityId: 'server-1',
      operation: 'update',
      payload: { item: updated },
    })

    const projected = await projectListWithPendingEntities({
      storage,
      mutationQueue: queue,
      base: [{ id: 'server-1', name: 'Server' }],
      entityType: 'client',
      entityId: (item) => item.id,
      localKey: (id) => `id:${id}`,
      collection: 'items',
      payloadItem: (payload) => (payload as { item?: Item }).item ?? null,
    })

    expect(projected).toEqual([
      { id: 'server-1', name: 'Updated locally' },
      { id: 'local-1', name: 'Local' },
    ])
  })

  it('applies pending patch rows to matching list items', async () => {
    const storage = new MemoryLocalDataPort()
    const queue = new KvMutationQueue(storage)

    await queue.enqueue({
      entityType: 'staff_services',
      entityId: 'staff-1',
      operation: 'update',
      payload: { serviceIds: ['service-2'] },
    })

    const projected = await projectListWithPendingPatches({
      mutationQueue: queue,
      base: [
        { id: 'staff-1', name: 'Staff', tags: ['service-1'] },
        { id: 'staff-2', name: 'Other', tags: ['service-1'] },
      ],
      entityType: 'staff_services',
      entityId: (item) => item.id,
      apply: (item, row) => ({
        ...item,
        tags: (row.payload as { serviceIds: string[] }).serviceIds,
      }),
    })

    expect(projected).toEqual([
      { id: 'staff-1', name: 'Staff', tags: ['service-2'] },
      { id: 'staff-2', name: 'Other', tags: ['service-1'] },
    ])
  })
})
