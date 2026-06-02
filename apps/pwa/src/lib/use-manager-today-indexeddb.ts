import { useMemo } from 'react'
import type { Client, Service, TodayData, User } from '@repo/salon-core/types'
import {
  toOfflineProjectionDisplay,
  useOfflineProjection,
} from '#/lib/offline-projection'

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
    const todayDisplay = toOfflineProjectionDisplay(proj, {
      live: liveToday,
      fromSnapshot: (s) => s?.data ?? undefined,
      hasSnapshot: (s) => s?.data != null,
    })

    if (proj.phase === 'snapshot') {
      const s = proj.snapshot as TodaySnapshot
      return {
        todayData: todayDisplay.value,
        staff: s.staff,
        services: s.services,
        clients: s.clients,
        phase: todayDisplay.phase,
        idbLoading: todayDisplay.idbLoading,
        snapshotUpdatedAt: todayDisplay.snapshotUpdatedAt,
        hasSnapshot: todayDisplay.hasSnapshot,
      }
    }

    return {
      todayData: todayDisplay.value,
      staff: proj.phase === 'empty' ? [] : (staffLive ?? []),
      services: proj.phase === 'empty' ? [] : (servicesLive ?? []),
      clients: proj.phase === 'empty' ? [] : (clientsLive ?? []),
      phase: todayDisplay.phase,
      idbLoading: todayDisplay.idbLoading,
      snapshotUpdatedAt: todayDisplay.snapshotUpdatedAt,
      hasSnapshot: todayDisplay.hasSnapshot,
    }
  }, [proj, liveToday, staffLive, servicesLive, clientsLive])
}
