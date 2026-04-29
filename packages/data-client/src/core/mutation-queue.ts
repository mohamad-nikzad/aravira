import type { LocalDataPort } from '../ports/local-data-port'
import { newOfflineEntityId } from './offline-entity-id'

export type MutationEntityType =
  | 'client'
  | 'appointment'
  | 'business_settings'
  | 'service'
  | 'staff_services'
  | 'staff_schedule'
export type MutationOperation = 'create' | 'update' | 'delete'

export type MutationQueueReviewReason = 'server_conflict' | 'max_attempts'

export type MutationQueueRow = {
  id: string
  entityType: MutationEntityType
  entityId: string
  operation: MutationOperation
  payload: unknown
  status: 'pending' | 'syncing' | 'conflict'
  attemptCount: number
  lastAttemptAt: string | null
  lastError: string | null
  createdAt: string
  /** Set when status is `conflict`. */
  reviewReason?: MutationQueueReviewReason | null
  /** Machine-readable code from API body when available. */
  conflictCode?: string | null
}

const COLLECTION = 'mutations'

/** Stop auto-retry after this many failed attempts (Phase 4; Phase 5 can surface for review). */
export const MUTATION_MAX_ATTEMPTS = 12

export type MutationQueuePort = {
  listPending(): Promise<MutationQueueRow[]>
  /** Pending, conflict, or in-flight sync rows that affect local UI overlays. */
  listForLocalOverlay(): Promise<MutationQueueRow[]>
  listAll(): Promise<MutationQueueRow[]>
  get(id: string): Promise<MutationQueueRow | undefined>
  save(row: MutationQueueRow): Promise<void>
  delete(id: string): Promise<void>
  /**
   * Enqueue a mutation with compaction (e.g. appointment create+delete drops both).
   * @returns queue row id, or null if nothing was stored (e.g. cancelled offline-only create)
   */
  enqueue(
    partial: Omit<MutationQueueRow, 'id' | 'status' | 'attemptCount' | 'lastAttemptAt' | 'lastError' | 'createdAt'> & {
      createdAt?: string
    }
  ): Promise<string | null>
  /** Runs queue and entity/cache writes against the same local storage transaction. */
  runAtomically<T>(fn: (queue: MutationQueuePort, storage: LocalDataPort) => Promise<T>): Promise<T>
}

function payloadRecord(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {}
}

function mergePatchPayloads(
  currentPayload: unknown,
  nextPayload: unknown
): Record<string, unknown> {
  const current = payloadRecord(currentPayload)
  const next = payloadRecord(nextPayload)
  const currentPatch = payloadRecord(current.patch)
  const nextPatch = payloadRecord(next.patch)

  return {
    ...current,
    ...next,
    patch: { ...currentPatch, ...nextPatch },
  }
}

export class KvMutationQueue implements MutationQueuePort {
  constructor(private readonly storage: LocalDataPort) {}

  async listAll(): Promise<MutationQueueRow[]> {
    const keys = await this.storage.listKeys(COLLECTION)
    const rows: MutationQueueRow[] = []
    for (const key of keys) {
      const r = await this.storage.get<MutationQueueRow>(COLLECTION, key)
      if (r) rows.push(r)
    }
    rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return rows
  }

  async listPending(): Promise<MutationQueueRow[]> {
    const rows = await this.listAll()
    return rows.filter((r) => r.status === 'pending')
  }

  async listForLocalOverlay(): Promise<MutationQueueRow[]> {
    const rows = await this.listAll()
    return rows.filter((r) => r.status === 'pending' || r.status === 'conflict' || r.status === 'syncing')
  }

  async get(id: string): Promise<MutationQueueRow | undefined> {
    return this.storage.get<MutationQueueRow>(COLLECTION, id)
  }

  async save(row: MutationQueueRow): Promise<void> {
    await this.storage.set(COLLECTION, row.id, row)
  }

  async delete(id: string): Promise<void> {
    await this.storage.delete(COLLECTION, id)
  }

  async enqueue(
    partial: Omit<MutationQueueRow, 'id' | 'status' | 'attemptCount' | 'lastAttemptAt' | 'lastError' | 'createdAt'> & {
      createdAt?: string
    }
  ): Promise<string | null> {
    const pending = (await this.listAll()).filter((r) => r.status === 'pending')
    const createdAt = partial.createdAt ?? new Date().toISOString()

    if (partial.entityType === 'appointment' && partial.operation === 'delete') {
      const same = pending.filter((r) => r.entityId === partial.entityId)
      const hadOnlyLocalCreate = same.some((r) => r.operation === 'create')
      if (hadOnlyLocalCreate) {
        for (const r of same) await this.delete(r.id)
        return null
      }
    }

    if (partial.entityType === 'business_settings' && partial.operation === 'update') {
      const row = pending.find(
        (r) =>
          r.entityType === 'business_settings' &&
          r.entityId === partial.entityId &&
          r.operation === 'update'
      )
      if (row) {
        await this.save({ ...row, payload: mergePatchPayloads(row.payload, partial.payload) })
        return row.id
      }
    }

    if (partial.entityType === 'staff_services' && partial.operation === 'update') {
      const row = pending.find((r) => r.entityType === 'staff_services' && r.entityId === partial.entityId)
      if (row) {
        await this.save({
          ...row,
          payload: partial.payload,
          attemptCount: 0,
          lastError: null,
        })
        return row.id
      }
    }

    if (partial.entityType === 'staff_schedule' && partial.operation === 'update') {
      const row = pending.find((r) => r.entityType === 'staff_schedule' && r.entityId === partial.entityId)
      if (row) {
        await this.save({
          ...row,
          payload: partial.payload,
          attemptCount: 0,
          lastError: null,
        })
        return row.id
      }
    }

    if (partial.entityType === 'service' && partial.operation === 'update') {
      const row = pending.find(
        (r) =>
          r.entityType === 'service' && r.entityId === partial.entityId && r.operation === 'update'
      )
      if (row) {
        await this.save({
          ...row,
          payload: mergePatchPayloads(row.payload, partial.payload),
        })
        return row.id
      }
    }

    const id = newOfflineEntityId()
    const row: MutationQueueRow = {
      id,
      entityType: partial.entityType,
      entityId: partial.entityId,
      operation: partial.operation,
      payload: partial.payload,
      status: 'pending',
      attemptCount: 0,
      lastAttemptAt: null,
      lastError: null,
      createdAt,
      reviewReason: null,
      conflictCode: null,
    }
    await this.save(row)
    return id
  }

  async runAtomically<T>(fn: (queue: MutationQueuePort, storage: LocalDataPort) => Promise<T>): Promise<T> {
    return this.storage.transaction((tx) => fn(new KvMutationQueue(tx), tx))
  }
}

/** Notifies after enqueue/save/delete so UI can refresh pending counts. */
export class NotifyingMutationQueue implements MutationQueuePort {
  constructor(
    private readonly inner: MutationQueuePort,
    private readonly onChange: () => void
  ) {}

  listPending(): Promise<MutationQueueRow[]> {
    return this.inner.listPending()
  }

  listForLocalOverlay(): Promise<MutationQueueRow[]> {
    return this.inner.listForLocalOverlay()
  }

  listAll(): Promise<MutationQueueRow[]> {
    return this.inner.listAll()
  }

  get(id: string): Promise<MutationQueueRow | undefined> {
    return this.inner.get(id)
  }

  async save(row: MutationQueueRow): Promise<void> {
    await this.inner.save(row)
    this.onChange()
  }

  async delete(id: string): Promise<void> {
    await this.inner.delete(id)
    this.onChange()
  }

  async enqueue(
    partial: Omit<MutationQueueRow, 'id' | 'status' | 'attemptCount' | 'lastAttemptAt' | 'lastError' | 'createdAt'> & {
      createdAt?: string
    }
  ): Promise<string | null> {
    const out = await this.inner.enqueue(partial)
    this.onChange()
    return out
  }

  async runAtomically<T>(fn: (queue: MutationQueuePort, storage: LocalDataPort) => Promise<T>): Promise<T> {
    const out = await this.inner.runAtomically(fn)
    this.onChange()
    return out
  }
}
