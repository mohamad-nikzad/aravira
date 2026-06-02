import { useMemo } from 'react'
import type {
  AppointmentWithDetails,
  BusinessHours,
  Client,
  Service,
  User,
} from '@repo/salon-core'
import { useOfflineProjection } from '#/lib/offline-projection'

type LiveBundles = {
  appointmentsData?: { appointments: AppointmentWithDetails[] }
  staffData?: { staff: User[] }
  servicesData?: { services: Service[] }
  clientsData?: { clients: Client[] }
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
  live: LiveBundles,
) {
  const proj = useOfflineProjection<CalendarSnapshot>({
    enabled,
    isOnline,
    deps: [
      isManager,
      startDate,
      endDate,
      live.appointmentsData,
      live.staffData,
      live.servicesData,
      live.clientsData,
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
      if (live.staffData) {
        tasks.push(client.staff.hydrateFromServer(live.staffData.staff))
      }
      if (live.servicesData) {
        tasks.push(client.services.hydrateFromServer(live.servicesData.services))
      }
      if (isManager && live.clientsData) {
        tasks.push(client.clients.hydrateListFromServer(live.clientsData.clients))
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
    switch (proj.phase) {
      case 'live':
        return {
          appointments: live.appointmentsData,
          staff: live.staffData,
          services: live.servicesData,
          clients: live.clientsData,
          business: live.businessData,
          offlineMeta: {
            loaded: false,
            idbLoading: proj.idbLoading,
            appointmentsUpdatedAt: null as string | null,
          },
        }
      case 'empty':
        return {
          appointments: undefined,
          staff: undefined,
          services: undefined,
          clients: undefined,
          business: undefined,
          offlineMeta: {
            loaded: false,
            idbLoading: proj.idbLoading,
            appointmentsUpdatedAt: null as string | null,
          },
        }
      case 'snapshot': {
        const s = proj.snapshot as CalendarSnapshot
        return {
          appointments: { appointments: s.appointments },
          staff: { staff: s.staff },
          services: { services: s.services },
          clients: isManager ? { clients: s.clients } : live.clientsData,
          business: { settings: s.businessSettings },
          offlineMeta: {
            loaded: true,
            idbLoading: proj.idbLoading,
            appointmentsUpdatedAt: proj.snapshotUpdatedAt,
          },
        }
      }
    }
  }, [proj, isManager, live])
}
