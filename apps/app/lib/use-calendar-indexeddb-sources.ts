'use client'

import { useEffect, useMemo, useState } from 'react'
import type {
  AppointmentWithDetails,
  BusinessHours,
  Client,
  Service,
  User,
} from '@repo/salon-core'
import { useManagerDataClient, useManagerOfflineDataEpoch } from '@/components/manager-data-client-provider'

type LiveBundles = {
  appointmentsData?: { appointments: AppointmentWithDetails[] }
  staffData?: { staff: User[] }
  servicesData?: { services: Service[] }
  clientsData?: { clients: Client[] }
  businessData?: { settings: BusinessHours | null }
}

type RepoState = {
  loaded: boolean
  appointments: AppointmentWithDetails[]
  staff: User[]
  services: Service[]
  clients: Client[]
  businessSettings: BusinessHours | null
  appointmentsUpdatedAt: string | null
}

const emptyRepo = (): RepoState => ({
  loaded: false,
  appointments: [],
  staff: [],
  services: [],
  clients: [],
  businessSettings: null,
  appointmentsUpdatedAt: null,
})

export function useCalendarIndexedDbSources(
  enabled: boolean,
  isOnline: boolean,
  isManager: boolean,
  startDate: string,
  endDate: string,
  live: LiveBundles
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
        const tasks: Promise<void>[] = []
        if (live.appointmentsData) {
          tasks.push(
            client.appointments.hydrateRangeFromServer(
              startDate,
              endDate,
              live.appointmentsData.appointments ?? []
            )
          )
        }
        if (live.staffData) {
          tasks.push(client.staff.hydrateFromServer(live.staffData.staff ?? []))
        }
        if (live.servicesData) {
          tasks.push(client.services.hydrateFromServer(live.servicesData.services ?? []))
        }
        if (isManager && live.clientsData) {
          tasks.push(client.clients.hydrateListFromServer(live.clientsData.clients ?? []))
        }
        if (live.businessData !== undefined) {
          tasks.push(client.businessSettings.hydrateFromServer(live.businessData.settings ?? null))
        }
        await Promise.all(tasks)
      }

      const [appointments, staff, services, clients, businessSettings, ts] = await Promise.all([
        client.appointments.list(startDate, endDate),
        client.staff.list(),
        client.services.list(),
        isManager ? client.clients.list() : Promise.resolve([] as Client[]),
        client.businessSettings.get(),
        client.appointments.rangeLastSyncedAt(startDate, endDate),
      ])

      if (cancelled) return
      setRepo({
        loaded: true,
        appointments,
        staff,
        services,
        clients,
        businessSettings,
        appointmentsUpdatedAt: ts,
      })
    })()

    return () => {
      cancelled = true
    }
  }, [
    enabled,
    client,
    isOnline,
    isManager,
    startDate,
    endDate,
    live.appointmentsData,
    live.staffData,
    live.servicesData,
    live.clientsData,
    live.businessData,
    offlineDataEpoch,
  ])

  const idbLoading = Boolean(enabled && client && !repo.loaded)

  return useMemo(() => {
    if (!enabled) {
      return {
        appointments: live.appointmentsData,
        staff: live.staffData,
        services: live.servicesData,
        clients: live.clientsData,
        business: live.businessData,
        offlineMeta: {
          loaded: false,
          idbLoading: false,
          appointmentsUpdatedAt: null as string | null,
        },
      }
    }

    if (!client) {
      return {
        appointments: live.appointmentsData,
        staff: live.staffData,
        services: live.servicesData,
        clients: live.clientsData,
        business: live.businessData,
        offlineMeta: {
          loaded: false,
          idbLoading: false,
          appointmentsUpdatedAt: null as string | null,
        },
      }
    }

    if (!repo.loaded) {
      if (isOnline) {
        return {
          appointments: live.appointmentsData,
          staff: live.staffData,
          services: live.servicesData,
          clients: live.clientsData,
          business: live.businessData,
          offlineMeta: {
            loaded: false,
            idbLoading: true,
            appointmentsUpdatedAt: null as string | null,
          },
        }
      }

      return {
        appointments: undefined,
        staff: undefined,
        services: undefined,
        clients: undefined,
        business: undefined,
        offlineMeta: {
          loaded: false,
          idbLoading: true,
          appointmentsUpdatedAt: null as string | null,
        },
      }
    }

    return {
      appointments: { appointments: repo.appointments },
      staff: { staff: repo.staff },
      services: { services: repo.services },
      clients: isManager ? { clients: repo.clients } : live.clientsData,
      business: { settings: repo.businessSettings },
      offlineMeta: {
        loaded: true,
        idbLoading: false,
        appointmentsUpdatedAt: repo.appointmentsUpdatedAt,
      },
    }
  }, [enabled, client, isOnline, isManager, live, repo])
}
