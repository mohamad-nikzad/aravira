'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Client, ClientSummary } from '@repo/salon-core'
import { useManagerDataClient, useManagerOfflineDataEpoch } from '@/components/manager-data-client-provider'

export function useClientsListIndexedDbSources(
  enabled: boolean,
  isOnline: boolean,
  live: { clients: Client[] } | undefined
) {
  const client = useManagerDataClient()
  const offlineDataEpoch = useManagerOfflineDataEpoch()
  const [repo, setRepo] = useState<{
    loaded: boolean
    clients: Client[]
    listUpdatedAt: string | null
  }>({ loaded: false, clients: [], listUpdatedAt: null })

  useEffect(() => {
    if (!enabled || !client) {
      setRepo({ loaded: false, clients: [], listUpdatedAt: null })
      return
    }

    let cancelled = false
    void (async () => {
      if (isOnline && live?.clients !== undefined) {
        await client.clients.hydrateListFromServer(live.clients)
      }
      const [rows, ts] = await Promise.all([client.clients.list(), client.clients.listLastSyncedAt()])
      if (cancelled) return
      setRepo({ loaded: true, clients: rows, listUpdatedAt: ts })
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, client, isOnline, live, offlineDataEpoch])

  const idbLoading = Boolean(enabled && client && !repo.loaded)

  return useMemo(() => {
    if (!enabled) {
      return {
        data: live,
        snapshotUpdatedAt: null as string | null,
        hasSnapshot: false,
        idbLoading: false,
      }
    }

    if (!client) {
      return {
        data: live,
        snapshotUpdatedAt: null as string | null,
        hasSnapshot: false,
        idbLoading: false,
      }
    }

    if (!repo.loaded) {
      if (isOnline) {
        return {
          data: live,
          snapshotUpdatedAt: null as string | null,
          hasSnapshot: false,
          idbLoading: true,
        }
      }
      return {
        data: undefined,
        snapshotUpdatedAt: null as string | null,
        hasSnapshot: false,
        idbLoading: true,
      }
    }

    return {
      data: { clients: repo.clients },
      snapshotUpdatedAt: repo.listUpdatedAt,
      hasSnapshot: true,
      idbLoading: false,
    }
  }, [enabled, client, isOnline, live, repo, idbLoading])
}

export function useClientSummaryIndexedDbSources(
  enabled: boolean,
  isOnline: boolean,
  clientId: string,
  live: ClientSummary | undefined
) {
  const client = useManagerDataClient()
  const offlineDataEpoch = useManagerOfflineDataEpoch()
  const [repo, setRepo] = useState<{
    loaded: boolean
    summary: ClientSummary | null
    updatedAt: string | null
  }>({ loaded: false, summary: null, updatedAt: null })

  useEffect(() => {
    if (!enabled || !client || !clientId) {
      setRepo({ loaded: false, summary: null, updatedAt: null })
      return
    }

    let cancelled = false
    void (async () => {
      if (isOnline && live) {
        await client.clients.hydrateSummaryFromServer(clientId, live)
      }
      const [summary, ts] = await Promise.all([
        client.clients.getSummary(clientId),
        client.clients.summaryLastSyncedAt(clientId),
      ])
      if (cancelled) return
      setRepo({ loaded: true, summary, updatedAt: ts })
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, client, isOnline, clientId, live, offlineDataEpoch])

  const idbLoading = Boolean(enabled && client && !repo.loaded)

  return useMemo(() => {
    if (!enabled) {
      return {
        data: live,
        snapshotUpdatedAt: null as string | null,
        hasSnapshot: false,
        idbLoading: false,
      }
    }

    if (!client) {
      return {
        data: live,
        snapshotUpdatedAt: null as string | null,
        hasSnapshot: false,
        idbLoading: false,
      }
    }

    if (!repo.loaded) {
      if (isOnline) {
        return {
          data: live,
          snapshotUpdatedAt: null as string | null,
          hasSnapshot: Boolean(live),
          idbLoading: true,
        }
      }
      return {
        data: undefined,
        snapshotUpdatedAt: null as string | null,
        hasSnapshot: false,
        idbLoading: true,
      }
    }

    return {
      data: repo.summary ?? undefined,
      snapshotUpdatedAt: repo.updatedAt,
      hasSnapshot: repo.summary != null,
      idbLoading: false,
    }
  }, [enabled, client, isOnline, live, repo, idbLoading])
}
