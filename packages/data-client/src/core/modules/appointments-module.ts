import type { Appointment, AppointmentWithDetails, Client, Service, User } from '@repo/salon-core'
import {
  detectScheduleOverlaps,
  isBlockingAppointmentStatus,
  SCHEDULE_CONFLICT_CODES,
  endTimeFromDuration,
  validateAppointmentWindow,
} from '@repo/salon-core'
import { readCacheTimestamp, writeCacheTimestamp } from '../cache-meta'
import type { HttpTransportPort } from '../../ports/http-transport'
import type { LocalDataPort } from '../../ports/local-data-port'
import { DataClientHttpError } from '../../ports/http-transport'
import { createListenerSet } from '../listeners'
import type { MutationQueuePort } from '../mutation-queue'
import { newOfflineEntityId } from '../offline-entity-id'

const COLLECTION = 'appointments'

type AppointmentsListResponse = { appointments: AppointmentWithDetails[] }
type AppointmentOneResponse = { appointment: AppointmentWithDetails }

export type AppointmentCreateInput = {
  clientId: string
  staffId: string
  serviceId: string
  date: string
  startTime: string
  endTime?: string
  durationMinutes?: number
  notes?: string
}

export type AppointmentUpdateInput = {
  clientId?: string
  staffId?: string
  serviceId?: string
  date?: string
  startTime?: string
  endTime?: string
  durationMinutes?: number
  status?: Appointment['status']
  notes?: string
}

function rangeKey(startDate: string, endDate: string) {
  return `range:${startDate}:${endDate}`
}

export type AppointmentsModuleDeps = {
  mutationQueue?: MutationQueuePort | null
  isOnline?: () => boolean
}

export interface AppointmentsModule {
  list(startDate: string, endDate: string): Promise<AppointmentWithDetails[]>
  getById(id: string): Promise<AppointmentWithDetails | null>
  refresh(startDate: string, endDate: string): Promise<AppointmentWithDetails[]>
  hydrateRangeFromServer(
    startDate: string,
    endDate: string,
    appointments: AppointmentWithDetails[]
  ): Promise<void>
  rangeLastSyncedAt(startDate: string, endDate: string): Promise<string | null>
  create(input: AppointmentCreateInput): Promise<AppointmentWithDetails>
  update(id: string, input: AppointmentUpdateInput): Promise<AppointmentWithDetails>
  updateStatus(id: string, status: Appointment['status']): Promise<AppointmentWithDetails>
  remove(id: string): Promise<void>
  subscribe(
    fn: (range: { startDate: string; endDate: string; appointments: AppointmentWithDetails[] }) => void
  ): () => void
}

export function createAppointmentsModule(
  transport: HttpTransportPort,
  storage: LocalDataPort,
  deps: AppointmentsModuleDeps = {}
): AppointmentsModule {
  const mutationQueue = deps.mutationQueue ?? null
  const isOnline = deps.isOnline ?? (() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  const listeners = createListenerSet<{
    startDate: string
    endDate: string
    appointments: AppointmentWithDetails[]
  }>()

  async function persistRange(
    startDate: string,
    endDate: string,
    appointments: AppointmentWithDetails[]
  ) {
    const key = rangeKey(startDate, endDate)
    try {
      await storage.transaction(async (tx) => {
        await tx.set(COLLECTION, key, appointments)
        await writeCacheTimestamp(tx, COLLECTION, key)
        for (const appointment of appointments) {
          await tx.set(COLLECTION, `one:${appointment.id}`, appointment)
        }
      })
    } catch {
      /* Cache writes are best-effort for online hydration. */
    }
    listeners.notify({ startDate, endDate, appointments })
  }

  async function fetchRange(startDate: string, endDate: string): Promise<AppointmentWithDetails[]> {
    const data = await transport.json<AppointmentsListResponse>('GET', '/api/appointments', {
      query: { startDate, endDate },
    })
    const appointments = data.appointments ?? []
    await persistRange(startDate, endDate, appointments)
    return appointments
  }

  async function loadRawRange(startDate: string, endDate: string): Promise<AppointmentWithDetails[]> {
    const key = rangeKey(startDate, endDate)
    const hit = await storage.get<AppointmentWithDetails[]>(COLLECTION, key)
    if (hit !== undefined) return [...hit]
    try {
      return await fetchRange(startDate, endDate)
    } catch {
      return []
    }
  }

  async function mergeOverlay(
    startDate: string,
    endDate: string,
    base: AppointmentWithDetails[]
  ): Promise<AppointmentWithDetails[]> {
    if (!mutationQueue) {
      return [...base].sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
    }
    const pending = await mutationQueue.listForLocalOverlay()
    const deleted = new Set<string>()
    const overlay = new Map<string, AppointmentWithDetails>()
    for (const m of pending) {
      if (m.entityType !== 'appointment') continue
      if (m.operation === 'delete') deleted.add(m.entityId)
      if (m.operation === 'create' || m.operation === 'update') {
        const pay = m.payload as { appointment?: AppointmentWithDetails }
        const apt = pay.appointment
        if (apt && apt.date >= startDate && apt.date <= endDate) overlay.set(apt.id, apt)
      }
    }
    const merged = base.filter((a) => !deleted.has(a.id))
    const byId = new Map(merged.map((a) => [a.id, a]))
    for (const [id, apt] of overlay) byId.set(id, apt)
    return [...byId.values()].sort((a, b) =>
      `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)
    )
  }

  async function invalidateAllRanges() {
    await storage.clearCollection(COLLECTION)
  }

  async function resolveServiceLocal(serviceId: string): Promise<Service | null> {
    for (const key of ['list', 'list:all'] as const) {
      const list = (await storage.get<Service[]>('services', key)) ?? []
      const hit = list.find((s) => s.id === serviceId)
      if (hit) return hit
    }
    const one = await storage.get<Service>('services', `id:${serviceId}`)
    if (one !== undefined) return one
    if (!mutationQueue) return null
    const pending = await mutationQueue.listForLocalOverlay()
    for (const m of pending) {
      if (m.entityType !== 'service' || m.entityId !== serviceId) continue
      if (m.operation === 'create' || m.operation === 'update') {
        const pay = m.payload as { service?: Service }
        if (pay.service) return pay.service
      }
    }
    return null
  }

  async function resolveClientStaffService(
    clientId: string,
    staffId: string,
    serviceId: string
  ): Promise<{ client: Client; staff: User; service: Service } | null> {
    const clients = (await storage.get<Client[]>('clients', 'list')) ?? []
    const staffList = (await storage.get<User[]>('staff', 'list')) ?? []
    const client = clients.find((c) => c.id === clientId) ?? (await storage.get<Client>('clients', `id:${clientId}`))
    const staff = staffList.find((s) => s.id === staffId)
    const service = await resolveServiceLocal(serviceId)
    if (!client || !staff || !service) return null
    return { client, staff, service }
  }

  function assertNoOverlap(
    candidate: Pick<
      AppointmentWithDetails,
      'id' | 'staffId' | 'clientId' | 'date' | 'startTime' | 'endTime' | 'status'
    >,
    others: AppointmentWithDetails[],
    excludeId?: string
  ) {
    const rows = others
      .filter((a) => a.id !== excludeId)
      .map((a) => ({
        id: a.id,
        staffId: a.staffId,
        clientId: a.clientId,
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
      }))
    const { staffConflict, clientConflict } = detectScheduleOverlaps(rows, {
      staffId: candidate.staffId,
      clientId: candidate.clientId,
      date: candidate.date,
      startTime: candidate.startTime,
      endTime: candidate.endTime,
      excludeId: candidate.id,
    })
    if (staffConflict) {
      throw new DataClientHttpError('پرسنل در این بازه نوبت دیگری دارد', 409, {
        code: SCHEDULE_CONFLICT_CODES.STAFF_OVERLAP,
      })
    }
    if (clientConflict) {
      throw new DataClientHttpError('مشتری در این بازه نوبت دیگری دارد', 409, {
        code: SCHEDULE_CONFLICT_CODES.CLIENT_OVERLAP,
      })
    }
  }

  async function patchAppointment(
    id: string,
    input: AppointmentUpdateInput
  ): Promise<AppointmentWithDetails> {
    const data = await transport.json<AppointmentOneResponse>('PATCH', `/api/appointments/${id}`, {
      body: input,
    })
    await invalidateAllRanges()
    const apt = data.appointment
    await storage.set(COLLECTION, `one:${apt.id}`, apt)
    listeners.notify({ startDate: apt.date, endDate: apt.date, appointments: [apt] })
    return apt
  }

  async function resolveCurrentAppointment(id: string): Promise<AppointmentWithDetails | null> {
    const fromStorage = await storage.get<AppointmentWithDetails>(COLLECTION, `one:${id}`)
    if (fromStorage !== undefined) return fromStorage
    if (!mutationQueue) return null
    const pending = await mutationQueue.listForLocalOverlay()
    for (const m of pending) {
      if (m.entityType === 'appointment' && m.entityId === id && m.operation !== 'delete') {
        const pay = m.payload as { appointment?: AppointmentWithDetails }
        if (pay.appointment) return pay.appointment
      }
    }
    return null
  }

  async function performOfflineUpdate(
    id: string,
    input: AppointmentUpdateInput
  ): Promise<AppointmentWithDetails> {
    const current = await resolveCurrentAppointment(id)
    if (!current) {
      throw new DataClientHttpError('نوبت یافت نشد', 404, null)
    }

    const next: AppointmentWithDetails = {
      ...current,
      ...input,
      clientId: input.clientId ?? current.clientId,
      staffId: input.staffId ?? current.staffId,
      serviceId: input.serviceId ?? current.serviceId,
      date: input.date ?? current.date,
      startTime: input.startTime ?? current.startTime,
      endTime: input.endTime ?? current.endTime,
      status: input.status ?? current.status,
      notes: input.notes !== undefined ? input.notes : current.notes,
      updatedAt: new Date(),
    }

    const resolved = await resolveClientStaffService(next.clientId, next.staffId, next.serviceId)
    if (!resolved) {
      throw new DataClientHttpError('اطلاعات پایه نوبت در حافظه محلی نیست', 400, { code: 'missing-reference' })
    }
    next.client = resolved.client
    next.staff = resolved.staff
    next.service = resolved.service

    const win = validateAppointmentWindow(next.startTime, next.endTime)
    if (!win.ok) throw new DataClientHttpError(win.error, 400, { code: 'validation-error' })

    const raw = await loadRawRange(next.date, next.date)
    const merged = await mergeOverlay(next.date, next.date, raw)
    const others = merged.filter((a) => a.id !== id)
    if (isBlockingAppointmentStatus(next.status)) {
      assertNoOverlap(next, others, id)
    }

    const pend = await mutationQueue!.listForLocalOverlay()
    const createRow = pend.find((p) => p.entityId === id && p.operation === 'create')
    if (createRow) {
      await mutationQueue!.runAtomically(async (txQueue, txStorage) => {
        await txQueue.save({
          ...createRow,
          payload: {
            id,
            createInput: {
              clientId: next.clientId,
              staffId: next.staffId,
              serviceId: next.serviceId,
              date: next.date,
              startTime: next.startTime,
              endTime: next.endTime,
              notes: next.notes,
              durationMinutes: input.durationMinutes,
            },
            appointment: next,
          },
        })
        await txStorage.set(COLLECTION, `one:${id}`, next)
      })
    } else {
      await mutationQueue!.runAtomically(async (txQueue, txStorage) => {
        await txQueue.enqueue({
          entityType: 'appointment',
          entityId: id,
          operation: 'update',
          payload: { id, patch: input, appointment: next },
        })
        await txStorage.set(COLLECTION, `one:${id}`, next)
      })
    }

    listeners.notify({ startDate: next.date, endDate: next.date, appointments: [next] })
    return next
  }

  return {
    async list(startDate, endDate) {
      const base = await loadRawRange(startDate, endDate)
      return mergeOverlay(startDate, endDate, base)
    },

    async getById(id: string) {
      if (mutationQueue) {
        const pending = await mutationQueue.listForLocalOverlay()
        for (const m of pending) {
          if (m.entityType !== 'appointment' || m.entityId !== id) continue
          if (m.operation === 'delete') return null
          const pay = m.payload as { appointment?: AppointmentWithDetails }
          if (pay.appointment) return pay.appointment
        }
      }

      const key = `one:${id}`
      const cached = await storage.get<AppointmentWithDetails>(COLLECTION, key)
      if (cached !== undefined) return cached

      let data: AppointmentOneResponse
      try {
        data = await transport.json<AppointmentOneResponse>('GET', `/api/appointments/${id}`)
      } catch {
        return null
      }
      const apt = data.appointment ?? null
      if (apt) await storage.set(COLLECTION, key, apt)
      return apt
    },

    refresh: fetchRange,

    hydrateRangeFromServer(startDate, endDate, appointments) {
      return persistRange(startDate, endDate, appointments)
    },

    rangeLastSyncedAt(startDate, endDate) {
      return readCacheTimestamp(storage, COLLECTION, rangeKey(startDate, endDate))
    },

    async create(input) {
      if (!mutationQueue || isOnline()) {
        const data = await transport.json<AppointmentOneResponse>('POST', '/api/appointments', {
          body: input,
        })
        await invalidateAllRanges()
        const apt = data.appointment
        await storage.set(COLLECTION, `one:${apt.id}`, apt)
        listeners.notify({ startDate: input.date, endDate: input.date, appointments: [apt] })
        return apt
      }

      const resolved = await resolveClientStaffService(input.clientId, input.staffId, input.serviceId)
      if (!resolved) {
        throw new DataClientHttpError('اطلاعات پایه نوبت (مشتری/پرسنل/خدمت) در حافظه محلی نیست', 400, {
          code: 'missing-reference',
        })
      }

      const dur =
        typeof input.durationMinutes === 'number' && input.durationMinutes > 0
          ? input.durationMinutes
          : resolved.service.duration
      const resolvedEndTime =
        input.endTime && input.endTime.trim() !== ''
          ? input.endTime.trim()
          : endTimeFromDuration(input.startTime, dur)

      const win = validateAppointmentWindow(input.startTime, resolvedEndTime)
      if (!win.ok) {
        throw new DataClientHttpError(win.error, 400, { code: 'validation-error' })
      }

      const id = newOfflineEntityId()
      const candidate: AppointmentWithDetails = {
        id,
        clientId: resolved.client.id,
        staffId: resolved.staff.id,
        serviceId: resolved.service.id,
        date: input.date,
        startTime: input.startTime,
        endTime: resolvedEndTime,
        status: 'scheduled',
        notes: input.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        client: resolved.client,
        staff: resolved.staff,
        service: resolved.service,
      }

      const rawSameDay = await loadRawRange(input.date, input.date)
      const mergedSameDay = await mergeOverlay(input.date, input.date, rawSameDay)
      const others = mergedSameDay.filter((a) => a.id !== id)
      assertNoOverlap(candidate, others)

      await mutationQueue.runAtomically(async (txQueue, txStorage) => {
        await txQueue.enqueue({
          entityType: 'appointment',
          entityId: id,
          operation: 'create',
          payload: {
            id,
            createInput: {
              clientId: input.clientId,
              staffId: input.staffId,
              serviceId: input.serviceId,
              date: input.date,
              startTime: input.startTime,
              endTime: resolvedEndTime,
              durationMinutes: input.durationMinutes,
              notes: input.notes,
            },
            appointment: candidate,
          },
        })
        await txStorage.set(COLLECTION, `one:${id}`, candidate)
      })

      listeners.notify({ startDate: input.date, endDate: input.date, appointments: [candidate] })
      return candidate
    },

    update: async (id, input) => {
      if (!mutationQueue || isOnline()) {
        return patchAppointment(id, input)
      }
      return performOfflineUpdate(id, input)
    },

    updateStatus: async (id, status) => {
      if (!mutationQueue || isOnline()) {
        return patchAppointment(id, { status })
      }
      return performOfflineUpdate(id, { status })
    },

    async remove(id: string) {
      if (!mutationQueue || isOnline()) {
        await transport.json<{ success: boolean }>('DELETE', `/api/appointments/${id}`)
        await invalidateAllRanges()
        return
      }

      const current = await resolveCurrentAppointment(id)
      const date = current?.date
      await mutationQueue.runAtomically(async (txQueue, txStorage) => {
        await txQueue.enqueue({
          entityType: 'appointment',
          entityId: id,
          operation: 'delete',
          payload: { id },
        })
        await txStorage.delete(COLLECTION, `one:${id}`)
      })
      if (date) {
        listeners.notify({ startDate: date, endDate: date, appointments: [] })
      }
    },

    subscribe(fn) {
      return listeners.subscribe(fn)
    },
  }
}
