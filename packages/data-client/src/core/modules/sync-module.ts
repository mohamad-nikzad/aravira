import type { Client } from '@repo/salon-core'
import { createListenerSet } from '../listeners'
import type { MutationQueuePort, MutationQueueRow } from '../mutation-queue'
import { processPendingMutations } from '../sync-process-pending'
import { readSyncAuthBlocked, readSyncLastSuccessAt } from '../sync-meta-keys'
import type { HttpTransportPort } from '../../ports/http-transport'
import type { LocalDataPort } from '../../ports/local-data-port'

const CLIENTS = 'clients'
const APPOINTMENTS = 'appointments'
const BUSINESS_SETTINGS = 'business_settings'
const SERVICES = 'services'
const STAFF = 'staff'

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
  const kind =
    row.entityType === 'client'
      ? 'مشتری'
      : row.entityType === 'appointment'
        ? 'نوبت'
        : row.entityType === 'business_settings'
          ? 'ساعات کاری'
          : row.entityType === 'service'
            ? 'خدمت'
            : row.entityType === 'staff_services'
              ? 'خدمات پرسنل'
              : row.entityType === 'staff_schedule'
                ? 'برنامه کاری'
                : 'تغییر'
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
      const list = (await storage.get<Client[]>(CLIENTS, 'list')) ?? []
      await storage.set(
        CLIENTS,
        'list',
        list.filter((c) => c.id !== id)
      )
      await storage.delete(CLIENTS, `id:${id}`)
      await storage.delete(CLIENTS, `summary:${id}`)
    } else if (row.operation === 'update') {
      await storage.delete(CLIENTS, `id:${row.entityId}`)
      await storage.delete(CLIENTS, `summary:${row.entityId}`)
      await storage.delete(CLIENTS, 'list')
    }
    return
  }

  if (row.entityType === 'appointment') {
    if (row.operation === 'create') {
      await storage.delete(APPOINTMENTS, `one:${row.entityId}`)
      await storage.clearCollection(APPOINTMENTS)
    } else if (row.operation === 'update') {
      await storage.delete(APPOINTMENTS, `one:${row.entityId}`)
      await storage.clearCollection(APPOINTMENTS)
    } else if (row.operation === 'delete') {
      await storage.clearCollection(APPOINTMENTS)
    }
    return
  }

  if (row.entityType === 'business_settings' && row.operation === 'update') {
    await storage.delete(BUSINESS_SETTINGS, 'settings')
    return
  }

  if (row.entityType === 'service') {
    if (row.operation === 'create') {
      const id = row.entityId
      await storage.delete(SERVICES, `id:${id}`)
      await storage.delete(SERVICES, 'list')
      await storage.delete(SERVICES, 'list:all')
    } else if (row.operation === 'update') {
      await storage.delete(SERVICES, 'list')
      await storage.delete(SERVICES, 'list:all')
      await storage.delete(SERVICES, `id:${row.entityId}`)
    }
    return
  }

  if (row.entityType === 'staff_services' && row.operation === 'update') {
    await storage.delete(STAFF, 'list')
    return
  }

  if (row.entityType === 'staff_schedule' && row.operation === 'update') {
    await storage.delete(STAFF, `schedule:${row.entityId}`)
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
