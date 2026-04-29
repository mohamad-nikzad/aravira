import type { Service } from '@repo/salon-core'
import { readCacheTimestamp, writeCacheTimestamp } from '../cache-meta'
import type { HttpTransportPort } from '../../ports/http-transport'
import type { LocalDataPort } from '../../ports/local-data-port'
import { DataClientHttpError } from '../../ports/http-transport'
import { createListenerSet } from '../listeners'
import type { MutationQueuePort } from '../mutation-queue'
import { newOfflineEntityId } from '../offline-entity-id'
import { defaultIsOnline, type OnlineStatusReader } from '../online-status'

const COLLECTION = 'services'

function listKey(includeInactive: boolean) {
  return includeInactive ? 'list:all' : 'list'
}

type ServicesResponse = { services: Service[] }
type ServiceOneResponse = { service: Service }

export type ServiceCreateInput = {
  name: string
  category: Service['category']
  duration: number
  price: number
  color: string
  active?: boolean
}

export type ServiceUpdateInput = Partial<
  Pick<Service, 'name' | 'category' | 'duration' | 'price' | 'color' | 'active'>
>

export interface ServicesModuleDeps {
  mutationQueue?: MutationQueuePort | null
  isOnline?: OnlineStatusReader
}

export interface ServicesModule {
  list(options?: { includeInactive?: boolean }): Promise<Service[]>
  getById(id: string, options?: { includeInactive?: boolean }): Promise<Service | null>
  refresh(options?: { includeInactive?: boolean }): Promise<Service[]>
  hydrateFromServer(services: Service[], options?: { includeInactive?: boolean }): Promise<void>
  listLastSyncedAt(options?: { includeInactive?: boolean }): Promise<string | null>
  subscribe(fn: (services: Service[]) => void): () => void
  create(input: ServiceCreateInput): Promise<Service>
  update(id: string, input: ServiceUpdateInput): Promise<Service>
}

export function createServicesModule(
  transport: HttpTransportPort,
  storage: LocalDataPort,
  deps: ServicesModuleDeps = {}
): ServicesModule {
  const mutationQueue = deps.mutationQueue ?? null
  const isOnline = deps.isOnline ?? defaultIsOnline

  const listeners = createListenerSet<Service[]>()

  async function emitSubscribers() {
    listeners.notify((await storage.get<Service[]>(COLLECTION, listKey(true))) ?? [])
  }

  async function persistList(includeInactive: boolean, services: Service[], silent?: boolean) {
    const key = listKey(includeInactive)
    await storage.set(COLLECTION, key, services)
    await writeCacheTimestamp(storage, COLLECTION, key)
    if (!silent) void emitSubscribers()
  }

  async function invalidateLists() {
    await storage.delete(COLLECTION, 'list')
    await storage.delete(COLLECTION, 'list:all')
  }

  async function fetchList(includeInactive: boolean): Promise<Service[]> {
    const data = await transport.json<ServicesResponse>('GET', '/api/services', {
      query: includeInactive ? { all: '1' } : undefined,
    })
    const services = data.services ?? []
    await persistList(includeInactive, services)
    return services
  }

  async function mergeHydrateListFromServer(serverServices: Service[], includeInactive: boolean) {
    if (!mutationQueue) {
      await persistList(includeInactive, serverServices)
      return
    }
    const pending = await mutationQueue.listForLocalOverlay()
    const pendingIds = new Set(
      pending.filter((p) => p.entityType === 'service').map((p) => p.entityId)
    )
    const byId = new Map(serverServices.map((s) => [s.id, s]))

    for (const id of pendingIds) {
      const local = await storage.get<Service>(COLLECTION, `id:${id}`)
      if (local) {
        byId.set(id, local)
        continue
      }
      const createRow = pending.find((p) => p.entityId === id && p.operation === 'create')
      if (createRow) {
        const pay = createRow.payload as { service?: Service }
        if (pay.service) byId.set(id, pay.service)
      }
    }

    await persistList(includeInactive, [...byId.values()])
  }

  async function list(includeInactive = false): Promise<Service[]> {
    const key = listKey(includeInactive)
    const hit = await storage.get<Service[]>(COLLECTION, key)
    if (hit !== undefined) return hit
    try {
      return await fetchList(includeInactive)
    } catch {
      return []
    }
  }

  return {
    list: (_opts?: { includeInactive?: boolean }) => list(Boolean(_opts?.includeInactive)),

    async getById(id: string, opts?: { includeInactive?: boolean }) {
      const key = `id:${id}`
      const cached = await storage.get<Service>(COLLECTION, key)
      if (cached !== undefined) return cached

      if (mutationQueue) {
        const pending = await mutationQueue.listForLocalOverlay()
        for (const m of pending) {
          if (m.entityType !== 'service' || m.entityId !== id) continue
          if (m.operation === 'create' || m.operation === 'update') {
            const pay = m.payload as { service?: Service }
            if (pay.service) return pay.service
          }
        }
      }

      const rows = await list(Boolean(opts?.includeInactive))
      const fromList = rows.find((s) => s.id === id) ?? null
      if (fromList) {
        await storage.set(COLLECTION, key, fromList)
        return fromList
      }

      try {
        const data = await transport.json<ServiceOneResponse>('GET', `/api/services/${id}`)
        const svc = data.service ?? null
        if (svc) {
          await storage.set(COLLECTION, key, svc)
          await writeCacheTimestamp(storage, COLLECTION, key)
        }
        return svc
      } catch {
        return null
      }
    },

    refresh: (_opts?: { includeInactive?: boolean }) =>
      fetchList(Boolean(_opts?.includeInactive)),

    hydrateFromServer(services, opts) {
      return mergeHydrateListFromServer(services, Boolean(opts?.includeInactive))
    },

    listLastSyncedAt(opts) {
      return readCacheTimestamp(storage, COLLECTION, listKey(Boolean(opts?.includeInactive)))
    },

    subscribe(fn) {
      return listeners.subscribe(fn)
    },

    async create(input) {
      if (!mutationQueue || isOnline()) {
        const data = await transport.json<ServiceOneResponse>('POST', '/api/services', {
          body: {
            name: input.name,
            category: input.category,
            duration: input.duration,
            price: input.price,
            color: input.color,
            active: input.active !== false,
          },
        })
        const service = data.service
        await invalidateLists()
        await storage.delete(COLLECTION, `id:${service.id}`)
        void emitSubscribers()
        return service
      }

      const id = newOfflineEntityId()
      const service: Service = {
        id,
        name: input.name,
        category: input.category,
        duration: input.duration,
        price: input.price,
        color: input.color,
        active: input.active !== false,
      }

      await mutationQueue.runAtomically(async (txQueue, txStorage) => {
        await txStorage.set(COLLECTION, `id:${id}`, service)
        const allKey = listKey(true)
        const actKey = listKey(false)
        const curAll = (await txStorage.get<Service[]>(COLLECTION, allKey)) ?? []
        const curAct = (await txStorage.get<Service[]>(COLLECTION, actKey)) ?? []
        await txStorage.set(COLLECTION, allKey, [service, ...curAll.filter((s) => s.id !== id)])
        await writeCacheTimestamp(txStorage, COLLECTION, allKey)
        await txStorage.set(
          COLLECTION,
          actKey,
          service.active ? [service, ...curAct.filter((s) => s.id !== id)] : curAct.filter((s) => s.id !== id)
        )
        await writeCacheTimestamp(txStorage, COLLECTION, actKey)
        await txQueue.enqueue({
          entityType: 'service',
          entityId: id,
          operation: 'create',
          payload: {
            id,
            body: {
              name: input.name,
              category: input.category,
              duration: input.duration,
              price: input.price,
              color: input.color,
              active: input.active !== false,
            },
            service,
          },
        })
      })

      void emitSubscribers()
      return service
    },

    async update(id, input) {
      if (!mutationQueue || isOnline()) {
        const data = await transport.json<ServiceOneResponse>('PATCH', `/api/services/${id}`, {
          body: input,
        })
        const service = data.service
        await storage.set(COLLECTION, `id:${id}`, service)
        await invalidateLists()
        void emitSubscribers()
        return service
      }

      const existing =
        (await storage.get<Service>(COLLECTION, `id:${id}`)) ??
        (await list(true)).find((s) => s.id === id) ??
        null
      if (!existing) {
        throw new DataClientHttpError('خدمت یافت نشد', 404, null)
      }

      const next: Service = {
        ...existing,
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.duration !== undefined ? { duration: input.duration } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      }

      const pend = await mutationQueue.listForLocalOverlay()
      const createRow = pend.find((p) => p.entityId === id && p.operation === 'create')

      await mutationQueue.runAtomically(async (txQueue, txStorage) => {
        await txStorage.set(COLLECTION, `id:${id}`, next)
        const curAll = (await txStorage.get<Service[]>(COLLECTION, listKey(true))) ?? []
        const curAct = (await txStorage.get<Service[]>(COLLECTION, listKey(false))) ?? []
        await txStorage.set(COLLECTION, listKey(true), curAll.map((s) => (s.id === id ? next : s)))
        await writeCacheTimestamp(txStorage, COLLECTION, listKey(true))
        await txStorage.set(
          COLLECTION,
          listKey(false),
          next.active ? [next, ...curAct.filter((s) => s.id !== id)] : curAct.filter((s) => s.id !== id)
        )
        await writeCacheTimestamp(txStorage, COLLECTION, listKey(false))

        if (createRow) {
          await txQueue.save({
            ...createRow,
            payload: {
              id,
              body: {
                name: next.name,
                category: next.category,
                duration: next.duration,
                price: next.price,
                color: next.color,
                active: next.active,
              },
              service: next,
            },
          })
        } else {
          await txQueue.enqueue({
            entityType: 'service',
            entityId: id,
            operation: 'update',
            payload: { id, patch: input, service: next },
          })
        }
      })

      void emitSubscribers()
      return next
    },
  }
}
