import type { Client } from '@repo/salon-core'
import { createListenerSet } from '../listeners'
import type { MutationQueuePort, MutationQueueRow } from '../mutation-queue'
import { processPendingMutations } from '../sync-process-pending'
import { readSyncAuthBlocked, readSyncLastSuccessAt } from '../sync-meta-keys'
import type { HttpTransportPort } from '../../ports/http-transport'
import type { LocalDataPort } from '../../ports/local-data-port'
import { LOCAL_COLLECTIONS } from '../local-collections'

export interface SyncState {
  pendingCount: number
  needsReviewCount: number
  lastSyncAt: string | null
  isSyncing: boolean
  authBlocked: boolean
}

export type SyncReviewItem = {
  queueRowId: string
  entityType: MutationQueueRow['entityType']
  entityId: string
  operation: MutationQueueRow['operation']
  title: string
  lastError: string | null
  conflictCode: string | null
  reviewReason: NonNullable<MutationQueueRow['reviewReason']>
}

export interface SyncModule {
  getState(): Promise<SyncState>
  listReviewItems(): Promise<SyncReviewItem[]>
  processPending(): Promise<void>
  retryMutation(queueRowId: string): Promise<void>
  discardMutation(queueRowId: string): Promise<void>
  subscribe(fn: (state: SyncState) => void): () => void
  /** Called when the mutation queue changes outside `processPending` (e.g. offline writes). */
  notifyQueueChanged(): void
}

function reviewTitle(row: MutationQueueRow): string {
  const kindByEntity: Record<MutationQueueRow['entityType'], string> = {
    appointment: 'نوبت',
    business_settings: 'ساعات کاری',
    client: 'مشتری',
    service: 'خدمت',
    staff_schedule: 'برنامه کاری',
    staff_services: 'خدمات پرسنل',
  }
  const kind = kindByEntity[row.entityType]
  const op =
    row.operation === 'create' ? 'ایجاد' : row.operation === 'update' ? 'ویرایش' : 'حذف'
  return `${op} ${kind}`
}

async function discardOne(input: {
  queue: MutationQueuePort
  storage: LocalDataPort
  row: MutationQueueRow
}): Promise<void> {
  const { queue, storage, row } = input
  await queue.delete(row.id)

  if (row.entityType === 'client') {
    if (row.operation === 'create') {
      const id = row.entityId
      const list = (await storage.get<Client[]>(LOCAL_COLLECTIONS.clients, 'list')) ?? []
      await storage.set(
        LOCAL_COLLECTIONS.clients,
        'list',
        list.filter((c) => c.id !== id)
      )
      await storage.delete(LOCAL_COLLECTIONS.clients, `id:${id}`)
      await storage.delete(LOCAL_COLLECTIONS.clients, `summary:${id}`)
    } else if (row.operation === 'update') {
      await storage.delete(LOCAL_COLLECTIONS.clients, `id:${row.entityId}`)
      await storage.delete(LOCAL_COLLECTIONS.clients, `summary:${row.entityId}`)
      await storage.delete(LOCAL_COLLECTIONS.clients, 'list')
    }
    return
  }

  if (row.entityType === 'appointment') {
    if (row.operation === 'create') {
      await storage.delete(LOCAL_COLLECTIONS.appointments, `one:${row.entityId}`)
      await storage.clearCollection(LOCAL_COLLECTIONS.appointments)
    } else if (row.operation === 'update') {
      await storage.delete(LOCAL_COLLECTIONS.appointments, `one:${row.entityId}`)
      await storage.clearCollection(LOCAL_COLLECTIONS.appointments)
    } else if (row.operation === 'delete') {
      await storage.clearCollection(LOCAL_COLLECTIONS.appointments)
    }
    return
  }

  if (row.entityType === 'business_settings' && row.operation === 'update') {
    await storage.delete(LOCAL_COLLECTIONS.businessSettings, 'settings')
    return
  }

  if (row.entityType === 'service') {
    if (row.operation === 'create') {
      const id = row.entityId
      await storage.delete(LOCAL_COLLECTIONS.services, `id:${id}`)
      await storage.delete(LOCAL_COLLECTIONS.services, 'list')
      await storage.delete(LOCAL_COLLECTIONS.services, 'list:all')
    } else if (row.operation === 'update') {
      await storage.delete(LOCAL_COLLECTIONS.services, 'list')
      await storage.delete(LOCAL_COLLECTIONS.services, 'list:all')
      await storage.delete(LOCAL_COLLECTIONS.services, `id:${row.entityId}`)
    }
    return
  }

  if (row.entityType === 'staff_services' && row.operation === 'update') {
    await storage.delete(LOCAL_COLLECTIONS.staff, 'list')
    return
  }

  if (row.entityType === 'staff_schedule' && row.operation === 'update') {
    await storage.delete(LOCAL_COLLECTIONS.staff, `schedule:${row.entityId}`)
    return
  }
}

export function createSyncModule(input: {
  queue: MutationQueuePort | null
  transport: HttpTransportPort
  storage: LocalDataPort
  isOnline: () => boolean
}): SyncModule {
  const { queue, transport, storage, isOnline } = input
  const listeners = createListenerSet<SyncState>()
  let isSyncingInternal = false

  async function readState(): Promise<SyncState> {
    const pending = queue ? await queue.listPending() : []
    const all = queue ? await queue.listAll() : []
    const needsReviewCount = all.filter((r) => r.status === 'conflict').length
    const lastSyncAt = await readSyncLastSuccessAt(storage)
    const authBlocked = await readSyncAuthBlocked(storage)
    return {
      pendingCount: pending.length,
      needsReviewCount,
      lastSyncAt,
      isSyncing: isSyncingInternal,
      authBlocked,
    }
  }

  function emit() {
    void readState().then((s) => listeners.notify(s))
  }

  return {
    getState() {
      return readState()
    },

    async listReviewItems() {
      if (!queue) return []
      const rows = (await queue.listAll()).filter((r) => r.status === 'conflict')
      return rows.map((r) => ({
        queueRowId: r.id,
        entityType: r.entityType,
        entityId: r.entityId,
        operation: r.operation,
        title: reviewTitle(r),
        lastError: r.lastError,
        conflictCode: r.conflictCode ?? null,
        reviewReason: r.reviewReason ?? 'server_conflict',
      }))
    },

    async processPending() {
      if (!queue) return
      const before = await readState()
      isSyncingInternal = true
      listeners.notify({ ...before, isSyncing: true })
      try {
        await processPendingMutations({ queue, transport, storage, isOnline })
      } finally {
        isSyncingInternal = false
        listeners.notify(await readState())
      }
    },

    async retryMutation(queueRowId) {
      if (!queue) return
      const row = await queue.get(queueRowId)
      if (!row || row.status !== 'conflict') return
      await queue.save({
        ...row,
        status: 'pending',
        attemptCount: 0,
        lastError: null,
        reviewReason: null,
        conflictCode: null,
      })
      emit()
    },

    async discardMutation(queueRowId) {
      if (!queue) return
      const row = await queue.get(queueRowId)
      if (!row || row.status !== 'conflict') return
      await discardOne({ queue, storage, row })
      emit()
    },

    subscribe(fn) {
      return listeners.subscribe(fn)
    },

    notifyQueueChanged() {
      emit()
    },
  }
}
