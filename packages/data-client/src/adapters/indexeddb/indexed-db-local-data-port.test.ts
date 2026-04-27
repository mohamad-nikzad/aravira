import { describe, it, expect, beforeEach } from 'vitest'
import { IndexedDbLocalDataPort } from './indexed-db-local-data-port'

describe('IndexedDbLocalDataPort', () => {
  let port: IndexedDbLocalDataPort

  beforeEach(() => {
    port = new IndexedDbLocalDataPort({ databaseName: `test-idb-${Math.random().toString(36).slice(2)}` })
  })

  it('persists values and clears by collection', async () => {
    await port.set('staff', 'list', [{ id: '1' }])
    const hit = await port.get<unknown[]>('staff', 'list')
    expect(hit).toEqual([{ id: '1' }])

    await port.set('staff', 'other', { x: 1 })
    await port.clearCollection('staff')

    expect(await port.get('staff', 'list')).toBeUndefined()
    expect(await port.get('staff', 'other')).toBeUndefined()
  })

  it('lists keys per collection', async () => {
    await port.set('staff', 'a', 1)
    await port.set('staff', 'b', 2)
    await port.set('services', 'x', 3)
    const keys = await port.listKeys('staff')
    expect(keys.sort()).toEqual(['a', 'b'])
  })
})
