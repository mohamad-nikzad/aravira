import { useMemo } from 'react'
import type { Client, ClientSummary } from '@repo/salon-core/types'
import {
  toOfflineProjectionDisplay,
  useOfflineProjection,
} from '#/lib/offline-projection'

export function useClientsListIndexedDbSources(
  enabled: boolean,
  isOnline: boolean,
  live: { clients: Client[] } | undefined,
) {
  const proj = useOfflineProjection<{ clients: Client[] }>({
    enabled,
    isOnline,
    deps: [live],
    hydrate: async (client) => {
      if (live?.clients !== undefined) {
        await client.clients.hydrateListFromServer(live.clients)
      }
    },
    read: async (client) => ({
      snapshot: { clients: await client.clients.list() },
      updatedAt: await client.clients.listLastSyncedAt(),
    }),
  })

  return useMemo(() => {
    const display = toOfflineProjectionDisplay(proj, {
      live,
      fromSnapshot: (s) => s ?? undefined,
      hasSnapshot: () => true,
    })
    return {
      data: display.value,
      snapshotUpdatedAt: display.snapshotUpdatedAt,
      hasSnapshot: display.hasSnapshot,
      idbLoading: display.idbLoading,
    }
  }, [proj, live])
}

export function useClientSummaryIndexedDbSources(
  enabled: boolean,
  isOnline: boolean,
  clientId: string,
  live: ClientSummary | undefined,
) {
  const proj = useOfflineProjection<ClientSummary | null>({
    enabled: enabled && Boolean(clientId),
    isOnline,
    deps: [clientId, live],
    hydrate: async (client) => {
      if (live) await client.clients.hydrateSummaryFromServer(clientId, live)
    },
    read: async (client) => ({
      snapshot: await client.clients.getSummary(clientId),
      updatedAt: await client.clients.summaryLastSyncedAt(clientId),
    }),
  })

  return useMemo(() => {
    const display = toOfflineProjectionDisplay(proj, {
      live,
      fromSnapshot: (s) => s ?? undefined,
      hasSnapshot: (s) => s != null,
    })
    const hasSnapshot =
      proj.phase === 'live'
        ? proj.idbLoading
          ? Boolean(live)
          : false
        : display.hasSnapshot

    return {
      data: display.value,
      snapshotUpdatedAt: display.snapshotUpdatedAt,
      hasSnapshot,
      idbLoading: display.idbLoading,
    }
  }, [proj, live])
}
