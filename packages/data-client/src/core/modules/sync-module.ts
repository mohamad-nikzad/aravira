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
  action?: string
  description?: string
  href?: string
  actionLabel?: string
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

  if (row.entityType === 'appointment' && row.operation === 'update') {
    const payload = row.payload as { action?: string }
    if (payload.action === 'complete_placeholder_client') {
      return 'تکمیل اطلاعات مشتری موقت'
    }
    if (payload.action === 'cancel_incomplete_placeholder') {
      return 'لغو رزرو مشتری موقت'
    }
  }

  return `${op} ${kind}`
}

function appointmentReviewFields(row: MutationQueueRow): Pick<
  SyncReviewItem,
  'action' | 'description' | 'href' | 'actionLabel'
> {
  if (row.entityType !== 'appointment') return {}

  const payload = row.payload as {
    action?: string
    appointment?: { id?: string; date?: string }
    reviewMetadata?: {
      action?: string
      appointmentId?: string
      appointmentDate?: string
    }
  }
  const appointmentId = payload.reviewMetadata?.appointmentId ?? payload.appointment?.id ?? row.entityId
  const appointmentDate = payload.reviewMetadata?.appointmentDate ?? payload.appointment?.date
  const href =
    appointmentId && appointmentDate
      ? `/calendar?date=${appointmentDate}&appointmentId=${appointmentId}`
      : '/calendar'
  const action = payload.reviewMetadata?.action ?? payload.action

  if (row.conflictCode === 'duplicate-phone') {
    return {
      action,
      description:
        'این شماره تماس قبلاً برای مشتری دیگری ثبت شده است. نوبت را از تقویم باز کنید و در تکمیل مشتری، گزینه انتقال به مشتری موجود را انتخاب کنید.',
      href,
      actionLabel: 'باز کردن نوبت در تقویم',
    }
  }

  if (row.conflictCode === 'placeholder-reuse') {
    return {
      action,
      description:
        'این مشتری موقت قبلاً به نوبت دیگری وصل شده است. نوبت را باز کنید و یک مشتری عادی انتخاب کنید یا برای این نوبت مشتری موقت تازه بسازید.',
      href,
      actionLabel: 'بررسی نوبت در تقویم',
    }
  }

  if (payload.action === 'cancel_incomplete_placeholder') {
    return {
      action,
      description:
        'حذف رزرو موقت روی سرور تایید نشد. نوبت را از تقویم باز کنید و دوباره وضعیت آن را بررسی یا لغو کنید.',
      href,
      actionLabel: 'باز کردن نوبت در تقویم',
    }
  }

  if (payload.action === 'complete_placeholder_client') {
    return {
      action,
      description:
        row.reviewReason === 'max_attempts'
          ? 'تکمیل اطلاعات این مشتری چند بار ناموفق مانده است. نوبت را باز کنید و اطلاعات مشتری را دوباره بررسی کنید.'
          : 'سرور تکمیل اطلاعات این مشتری موقت را نپذیرفت. نوبت را باز کنید و اطلاعات ثبت‌شده را دوباره بررسی کنید.',
      href,
      actionLabel: 'باز کردن نوبت در تقویم',
    }
  }

  return {
    action,
    href,
    actionLabel: 'باز کردن در تقویم',
  }
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
      const payload = row.payload as { localPlaceholderClientId?: string }
      if (payload.localPlaceholderClientId) {
        await storage.delete(LOCAL_COLLECTIONS.clients, `id:${payload.localPlaceholderClientId}`)
        await storage.delete(LOCAL_COLLECTIONS.clients, `summary:${payload.localPlaceholderClientId}`)
      }
      await storage.delete(LOCAL_COLLECTIONS.appointments, `one:${row.entityId}`)
      await storage.clearCollection(LOCAL_COLLECTIONS.appointments)
      await storage.delete(LOCAL_COLLECTIONS.clients, 'list')
    } else if (row.operation === 'update') {
      const payload = row.payload as {
        localPlaceholderClientId?: string
        action?: string
        appointment?: { client?: { id: string } }
      }
      if (payload.localPlaceholderClientId) {
        await storage.delete(LOCAL_COLLECTIONS.clients, `id:${payload.localPlaceholderClientId}`)
        await storage.delete(LOCAL_COLLECTIONS.clients, `summary:${payload.localPlaceholderClientId}`)
      }
      if (payload.action === 'complete_placeholder_client' && payload.appointment?.client?.id) {
        await storage.delete(LOCAL_COLLECTIONS.clients, `summary:${payload.appointment.client.id}`)
      }
      await storage.delete(LOCAL_COLLECTIONS.appointments, `one:${row.entityId}`)
      await storage.clearCollection(LOCAL_COLLECTIONS.appointments)
      await storage.delete(LOCAL_COLLECTIONS.clients, 'list')
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
        ...appointmentReviewFields(r),
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
