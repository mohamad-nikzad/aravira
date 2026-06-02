import { useMemo } from 'react'
import type { Client, Service, TodayData, User } from '@repo/salon-core/types'
import { useOfflineProjection } from '#/lib/offline-projection'

type TodaySnapshot = {
  data: TodayData | null
  staff: User[]
  services: Service[]
  clients: Client[]
}

export function useManagerTodayIndexedDbSources(
  enabled: boolean,
  isOnline: boolean,
  managerDate: string,
  liveToday: TodayData | undefined,
  staffLive: User[] | undefined,
  servicesLive: Service[] | undefined,
  clientsLive: Client[] | undefined,
) {
  const proj = useOfflineProjection<TodaySnapshot>({
    enabled,
    isOnline,
    deps: [managerDate, liveToday, staffLive, servicesLive, clientsLive],
    hydrate: async (client) => {
      if (liveToday) await client.today.hydrateFromServer(managerDate, liveToday)
      if (staffLive !== undefined)
        await client.staff.hydrateFromServer(staffLive)
      if (servicesLive !== undefined)
        await client.services.hydrateFromServer(servicesLive)
      if (clientsLive !== undefined)
        await client.clients.hydrateListFromServer(clientsLive)
    },
    read: async (client) => {
      const [data, staff, services, clients, updatedAt] = await Promise.all([
        client.today.getForDate(managerDate),
        client.staff.list(),
        client.services.list(),
        client.clients.list(),
        client.today.dayLastSyncedAt(managerDate),
      ])
      return { snapshot: { data, staff, services, clients }, updatedAt }
    },
  })

  return useMemo(() => {
    switch (proj.phase) {
      case 'live':
        return {
          todayData: liveToday,
          staff: staffLive ?? [],
          services: servicesLive ?? [],
          clients: clientsLive ?? [],
          snapshotUpdatedAt: null as string | null,
          hasSnapshot: false,
          idbLoading: proj.idbLoading,
        }
      case 'empty':
        return {
          todayData: undefined,
          staff: [] as User[],
          services: [] as Service[],
          clients: [] as Client[],
          snapshotUpdatedAt: null as string | null,
          hasSnapshot: false,
          idbLoading: proj.idbLoading,
        }
      case 'snapshot': {
        const s = proj.snapshot as TodaySnapshot
        return {
          todayData: s.data ?? undefined,
          staff: s.staff,
          services: s.services,
          clients: s.clients,
          snapshotUpdatedAt: proj.snapshotUpdatedAt,
          hasSnapshot: s.data != null,
          idbLoading: proj.idbLoading,
        }
      }
    }
  }, [proj, liveToday, staffLive, servicesLive, clientsLive])
}
