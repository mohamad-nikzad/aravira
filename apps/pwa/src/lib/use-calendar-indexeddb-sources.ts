import { useMemo } from 'react'
import type {
  AppointmentWithDetails,
  BusinessHours,
  Client,
  Service,
  User,
} from '@repo/salon-core'
import {
  toOfflineProjectionDisplay,
  useOfflineProjection,
} from '#/lib/offline-projection'

type LiveInput = {
  appointmentsData?: { appointments: AppointmentWithDetails[] }
  staff?: User[]
  services?: Service[]
  clients?: Client[]
  businessData?: { settings: BusinessHours | null }
}

type CalendarSnapshot = {
  appointments: AppointmentWithDetails[]
  staff: User[]
  services: Service[]
  clients: Client[]
  businessSettings: BusinessHours | null
}

export function useCalendarIndexedDbSources(
  enabled: boolean,
  isOnline: boolean,
  isManager: boolean,
  startDate: string,
  endDate: string,
  live: LiveInput,
) {
  const proj = useOfflineProjection<CalendarSnapshot>({
    enabled,
    isOnline,
    deps: [
      isManager,
      startDate,
      endDate,
      live.appointmentsData,
      live.staff,
      live.services,
      live.clients,
      live.businessData,
    ],
    hydrate: async (client) => {
      const tasks: Promise<void>[] = []
      if (live.appointmentsData) {
        tasks.push(
          client.appointments.hydrateRangeFromServer(
            startDate,
            endDate,
            live.appointmentsData.appointments,
          ),
        )
      }
      if (live.staff !== undefined) {
        tasks.push(client.staff.hydrateFromServer(live.staff))
      }
      if (live.services !== undefined) {
        tasks.push(client.services.hydrateFromServer(live.services))
      }
      if (isManager && live.clients !== undefined) {
        tasks.push(client.clients.hydrateListFromServer(live.clients))
      }
      if (live.businessData !== undefined) {
        tasks.push(
          client.businessSettings.hydrateFromServer(
            live.businessData.settings ?? null,
          ),
        )
      }
      await Promise.all(tasks)
    },
    read: async (client) => {
      const [appointments, staff, services, clients, businessSettings, ts] =
        await Promise.all([
          client.appointments.list(startDate, endDate),
          client.staff.list(),
          client.services.list(),
          isManager ? client.clients.list() : Promise.resolve([] as Client[]),
          client.businessSettings.get(),
          client.appointments.rangeLastSyncedAt(startDate, endDate),
        ])
      return {
        snapshot: { appointments, staff, services, clients, businessSettings },
        updatedAt: ts,
      }
    },
  })

  return useMemo(() => {
    const appointmentsDisplay = toOfflineProjectionDisplay(proj, {
      live: live.appointmentsData,
      fromSnapshot: (s) =>
        s ? { appointments: s.appointments } : undefined,
      hasSnapshot: () => true,
    })

    if (proj.phase === 'snapshot') {
      const s = proj.snapshot as CalendarSnapshot
      return {
        appointments: appointmentsDisplay.value,
        staff: s.staff,
        services: s.services,
        clients: isManager ? s.clients : (live.clients ?? []),
        business: { settings: s.businessSettings },
        phase: appointmentsDisplay.phase,
        idbLoading: appointmentsDisplay.idbLoading,
        snapshotUpdatedAt: appointmentsDisplay.snapshotUpdatedAt,
        hasSnapshot: appointmentsDisplay.hasSnapshot,
      }
    }

    return {
      appointments: appointmentsDisplay.value,
      staff: proj.phase === 'empty' ? [] : (live.staff ?? []),
      services: proj.phase === 'empty' ? [] : (live.services ?? []),
      clients: proj.phase === 'empty' ? [] : (live.clients ?? []),
      business: live.businessData,
      phase: appointmentsDisplay.phase,
      idbLoading: appointmentsDisplay.idbLoading,
      snapshotUpdatedAt: appointmentsDisplay.snapshotUpdatedAt,
      hasSnapshot: appointmentsDisplay.hasSnapshot,
    }
  }, [proj, isManager, live])
}
