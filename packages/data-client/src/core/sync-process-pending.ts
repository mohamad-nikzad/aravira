import type { HttpTransportPort } from '../ports/http-transport'
import type { LocalDataPort } from '../ports/local-data-port'
import type { MutationQueuePort, MutationQueueRow } from './mutation-queue'
import { MUTATION_MAX_ATTEMPTS } from './mutation-queue'
import { httpErrorCodeFromException, isAuthHttpError, isServerConflictError } from './sync-http-error'
import { writeSyncAuthBlocked, writeSyncLastSuccessAt } from './sync-meta-keys'
import { writeCacheTimestamp } from './cache-meta'
import { LOCAL_COLLECTIONS } from './local-collections'

type ClientDetailResponse = { client: unknown }
type AppointmentOneResponse = { appointment: unknown }

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export async function processPendingMutations(input: {
  queue: MutationQueuePort
  transport: HttpTransportPort
  storage: LocalDataPort
  isOnline: () => boolean
}): Promise<void> {
  const { queue, transport, storage, isOnline } = input
  if (!isOnline()) return

  for (const r of await queue.listAll()) {
    if (r.status === 'syncing') {
      await queue.save({ ...r, status: 'pending' })
    }
    if (r.status === 'pending' && r.attemptCount >= MUTATION_MAX_ATTEMPTS) {
      await queue.save({
        ...r,
        status: 'conflict',
        reviewReason: 'max_attempts',
        conflictCode: r.conflictCode ?? null,
      })
    }
  }

  const maxPerRun = 50

  for (let n = 0; n < maxPerRun; n++) {
    const pending = await queue.listPending()
    const next = pending[0]
    if (!next) return

    await queue.save({
      ...next,
      status: 'syncing',
      lastAttemptAt: new Date().toISOString(),
    })

    try {
      await applyOneMutation({ transport, storage, row: next })
      await queue.delete(next.id)
      await writeSyncLastSuccessAt(storage, new Date().toISOString())
      await writeSyncAuthBlocked(storage, false)
    } catch (e) {
      const msg = errMessage(e)
      const code = httpErrorCodeFromException(e)

      if (isAuthHttpError(e)) {
        await queue.save({
          ...next,
          status: 'pending',
          attemptCount: next.attemptCount,
          lastError: msg,
          lastAttemptAt: new Date().toISOString(),
        })
        await writeSyncAuthBlocked(storage, true)
        return
      }

      if (isServerConflictError(e)) {
        await queue.save({
          ...next,
          status: 'conflict',
          attemptCount: next.attemptCount,
          lastError: msg,
          lastAttemptAt: new Date().toISOString(),
          reviewReason: 'server_conflict',
          conflictCode: code,
        })
        return
      }

      const nextAttempts = next.attemptCount + 1
      if (nextAttempts >= MUTATION_MAX_ATTEMPTS) {
        await queue.save({
          ...next,
          status: 'conflict',
          attemptCount: nextAttempts,
          lastError: msg,
          lastAttemptAt: new Date().toISOString(),
          reviewReason: 'max_attempts',
          conflictCode: code,
        })
      } else {
        await queue.save({
          ...next,
          status: 'pending',
          attemptCount: nextAttempts,
          lastError: msg,
          lastAttemptAt: new Date().toISOString(),
        })
      }
      return
    }
  }
}

async function applyOneMutation(input: {
  transport: HttpTransportPort
  storage: LocalDataPort
  row: MutationQueueRow
}): Promise<void> {
  const { transport, storage, row } = input

  if (row.entityType === 'client') {
    if (row.operation === 'create') {
      const p = row.payload as {
        input: { name: string; phone: string; notes?: string; tags?: string[] }
        id: string
      }
      await transport.json<ClientDetailResponse>('POST', '/api/clients', {
        body: { ...p.input, id: p.id, tags: p.input.tags ?? [] },
      })
      await storage.delete(LOCAL_COLLECTIONS.clients, 'list')
      await storage.delete(LOCAL_COLLECTIONS.clients, `summary:${p.id}`)
      return
    }
    if (row.operation === 'update') {
      const p = row.payload as {
        id: string
        input: { name?: string; phone?: string; notes?: string; tags?: string[] }
      }
      await transport.json<ClientDetailResponse>('PATCH', `/api/clients/${p.id}`, {
        body: p.input,
      })
      await storage.delete(LOCAL_COLLECTIONS.clients, 'list')
      await storage.delete(LOCAL_COLLECTIONS.clients, `summary:${p.id}`)
      return
    }
    return
  }

  if (row.entityType === 'appointment') {
    if (row.operation === 'create') {
      const p = row.payload as {
        id: string
        createInput: Record<string, unknown>
        localPlaceholderClientId?: string
      }
      await transport.json<AppointmentOneResponse>('POST', '/api/appointments', {
        body: { ...p.createInput, id: p.id },
      })
      await storage.clearCollection(LOCAL_COLLECTIONS.appointments)
      if (p.localPlaceholderClientId) {
        await storage.delete(LOCAL_COLLECTIONS.clients, `id:${p.localPlaceholderClientId}`)
        await storage.delete(LOCAL_COLLECTIONS.clients, `summary:${p.localPlaceholderClientId}`)
      }
      return
    }
    if (row.operation === 'update') {
      const p = row.payload as {
        id: string
        patch?: Record<string, unknown>
        action?: string
        input?: Record<string, unknown>
        appointment?: { client?: { id: string } }
        localPlaceholderClientId?: string
      }
      if (p.action === 'complete_placeholder_client') {
        await transport.json<AppointmentOneResponse>('POST', `/api/appointments/${p.id}/complete-client`, {
          body: p.input,
        })
      } else {
        await transport.json<AppointmentOneResponse | { removedAppointmentId?: string }>(
          'PATCH',
          `/api/appointments/${p.id}`,
          {
          body: p.patch,
          }
        )
      }
      await storage.clearCollection(LOCAL_COLLECTIONS.appointments)
      if (p.localPlaceholderClientId) {
        await storage.delete(LOCAL_COLLECTIONS.clients, `id:${p.localPlaceholderClientId}`)
        await storage.delete(LOCAL_COLLECTIONS.clients, `summary:${p.localPlaceholderClientId}`)
      }
      if (p.action === 'complete_placeholder_client' && p.appointment?.client?.id) {
        await storage.delete(LOCAL_COLLECTIONS.clients, `summary:${p.appointment.client.id}`)
      }
      await storage.delete(LOCAL_COLLECTIONS.clients, 'list')
      return
    }
    if (row.operation === 'delete') {
      await transport.json<{ success: boolean }>('DELETE', `/api/appointments/${row.entityId}`)
      await storage.clearCollection(LOCAL_COLLECTIONS.appointments)
      return
    }
  }

  if (row.entityType === 'business_settings' && row.operation === 'update') {
    const p = row.payload as {
      patch: { workingStart?: string; workingEnd?: string; slotDurationMinutes?: number }
    }
    const data = await transport.json<{ settings: unknown }>('PATCH', '/api/settings/business', {
      body: p.patch,
    })
    if (data.settings !== undefined) {
      await storage.set(LOCAL_COLLECTIONS.businessSettings, 'settings', data.settings)
      await writeCacheTimestamp(storage, LOCAL_COLLECTIONS.businessSettings, 'settings')
    }
    return
  }

  if (row.entityType === 'service') {
    if (row.operation === 'create') {
      const p = row.payload as { id: string; body: Record<string, unknown> }
      await transport.json<{ service: unknown }>('POST', '/api/services', {
        body: { ...p.body, id: p.id },
      })
      await storage.delete(LOCAL_COLLECTIONS.services, 'list')
      await storage.delete(LOCAL_COLLECTIONS.services, 'list:all')
      await storage.delete(LOCAL_COLLECTIONS.services, `id:${p.id}`)
      return
    }
    if (row.operation === 'update') {
      const p = row.payload as { id: string; patch: Record<string, unknown> }
      await transport.json<{ service: unknown }>('PATCH', `/api/services/${p.id}`, {
        body: p.patch,
      })
      await storage.delete(LOCAL_COLLECTIONS.services, 'list')
      await storage.delete(LOCAL_COLLECTIONS.services, 'list:all')
      await storage.delete(LOCAL_COLLECTIONS.services, `id:${p.id}`)
      return
    }
  }

  if (row.entityType === 'staff_services' && row.operation === 'update') {
    const p = row.payload as { staffId: string; serviceIds: string[] | null }
    await transport.json<{ staff: unknown }>('PATCH', `/api/staff/${p.staffId}/services`, {
      body: { serviceIds: p.serviceIds },
    })
    await storage.delete(LOCAL_COLLECTIONS.staff, 'list')
    return
  }

  if (row.entityType === 'staff_schedule' && row.operation === 'update') {
    const p = row.payload as {
      staffId: string
      schedule: Array<{ dayOfWeek: number; active: boolean; workingStart: string; workingEnd: string }>
    }
    await transport.json<{ schedule: unknown }>('PUT', `/api/staff/${p.staffId}/schedule`, {
      body: { schedule: p.schedule },
    })
    await storage.delete(LOCAL_COLLECTIONS.staff, `schedule:${p.staffId}`)
    return
  }
}
