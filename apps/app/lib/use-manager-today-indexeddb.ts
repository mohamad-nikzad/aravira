'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Client, Service, TodayData, User } from '@repo/salon-core'
import { useManagerDataClient, useManagerOfflineDataEpoch } from '@/components/manager-data-client-provider'

type RepoState = {
  loaded: boolean
  data: TodayData | null
  staff: User[]
  services: Service[]
  clients: Client[]
  todayUpdatedAt: string | null
}

function emptyRepo(): RepoState {
  return {
    loaded: false,
    data: null,
    staff: [],
    services: [],
    clients: [],
    todayUpdatedAt: null,
  }
}

export function useManagerTodayIndexedDbSources(
  enabled: boolean,
  isOnline: boolean,
  managerDate: string,
  liveToday: TodayData | undefined,
  staffLive: User[] | undefined,
  servicesLive: Service[] | undefined,
  clientsLive: Client[] | undefined
) {
  const client = useManagerDataClient()
  const offlineDataEpoch = useManagerOfflineDataEpoch()
  const [repo, setRepo] = useState<RepoState>(emptyRepo)

  useEffect(() => {
    if (!enabled || !client) {
      setRepo(emptyRepo())
      return
    }

    let cancelled = false

    void (async () => {
      if (isOnline) {
        if (liveToday) await client.today.hydrateFromServer(managerDate, liveToday)
        if (staffLive !== undefined) await client.staff.hydrateFromServer(staffLive)
        if (servicesLive !== undefined) await client.services.hydrateFromServer(servicesLive)
        if (clientsLive !== undefined) await client.clients.hydrateListFromServer(clientsLive)
      }

      const [data, st, se, cl, ts] = await Promise.all([
        client.today.getForDate(managerDate),
        client.staff.list(),
        client.services.list(),
        client.clients.list(),
        client.today.dayLastSyncedAt(managerDate),
      ])

      if (cancelled) return
      setRepo({
        loaded: true,
        data,
        staff: st,
        services: se,
        clients: cl,
        todayUpdatedAt: ts,
      })
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, client, isOnline, managerDate, liveToday, staffLive, servicesLive, clientsLive, offlineDataEpoch])

  const idbLoading = Boolean(enabled && client && !repo.loaded)

  return useMemo(() => {
    if (!enabled) {
      return {
        todayData: liveToday,
        staff: staffLive ?? [],
        services: servicesLive ?? [],
        clients: clientsLive ?? [],
        snapshotUpdatedAt: null as string | null,
        hasSnapshot: false,
        idbLoading: false,
      }
    }

    if (!client) {
      return {
        todayData: liveToday,
        staff: staffLive ?? [],
        services: servicesLive ?? [],
        clients: clientsLive ?? [],
        snapshotUpdatedAt: null as string | null,
        hasSnapshot: false,
        idbLoading: false,
      }
    }

    if (!repo.loaded) {
      if (isOnline) {
        return {
          todayData: liveToday,
          staff: staffLive ?? [],
          services: servicesLive ?? [],
          clients: clientsLive ?? [],
          snapshotUpdatedAt: null as string | null,
          hasSnapshot: false,
          idbLoading: true,
        }
      }

      return {
        todayData: undefined,
        staff: [],
        services: [],
        clients: [],
        snapshotUpdatedAt: null as string | null,
        hasSnapshot: false,
        idbLoading: true,
      }
    }

    return {
      todayData: repo.data ?? undefined,
      staff: repo.staff,
      services: repo.services,
      clients: repo.clients,
      snapshotUpdatedAt: repo.todayUpdatedAt,
      hasSnapshot: repo.data != null,
      idbLoading: false,
    }
  }, [enabled, client, isOnline, liveToday, staffLive, servicesLive, clientsLive, repo])
}
