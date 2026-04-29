import type { LocalDataPort } from '../ports/local-data-port'
import type { MutationEntityType, MutationQueuePort, MutationQueueRow } from './mutation-queue'

type EntityProjectionInput<T> = {
  storage: LocalDataPort
  mutationQueue: MutationQueuePort | null
  base: T[]
  entityType: MutationEntityType
  entityId: (item: T) => string
  localKey: (entityId: string) => string
  collection: string
  payloadItem?: (payload: unknown) => T | null
}

export async function projectListWithPendingEntities<T>(
  input: EntityProjectionInput<T>
): Promise<T[]> {
  const { storage, mutationQueue, base, entityType, entityId, localKey, collection, payloadItem } = input
  if (!mutationQueue) return base

  const pending = await mutationQueue.listForLocalOverlay()
  const relevant = pending.filter((row) => row.entityType === entityType)
  if (relevant.length === 0) return base

  const byId = new Map(base.map((item) => [entityId(item), item]))

  for (const row of relevant) {
    const local = await storage.get<T>(collection, localKey(row.entityId))
    if (local !== undefined) {
      byId.set(row.entityId, local)
      continue
    }

    const projected = payloadItem?.(row.payload) ?? null
    if (projected) {
      byId.set(row.entityId, projected)
    }
  }

  return [...byId.values()]
}

type PatchProjectionInput<T> = {
  mutationQueue: MutationQueuePort | null
  base: T[]
  entityType: MutationEntityType
  entityId: (item: T) => string
  apply: (item: T, row: MutationQueueRow) => T
}

export async function projectListWithPendingPatches<T>(
  input: PatchProjectionInput<T>
): Promise<T[]> {
  const { mutationQueue, base, entityType, entityId, apply } = input
  if (!mutationQueue) return base

  const pending = await mutationQueue.listForLocalOverlay()
  const relevant = pending.filter((row) => row.entityType === entityType)
  if (relevant.length === 0) return base

  const byId = new Map(base.map((item) => [entityId(item), item]))
  for (const row of relevant) {
    const current = byId.get(row.entityId)
    if (current) {
      byId.set(row.entityId, apply(current, row))
    }
  }

  return [...byId.values()]
}
