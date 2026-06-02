import { useMemo } from 'react'
import type { Client, ClientSummary } from '@repo/salon-core/types'
import { useOfflineProjection } from '#/lib/offline-projection'

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
    switch (proj.phase) {
      case 'live':
        return {
          data: live,
          snapshotUpdatedAt: null as string | null,
          hasSnapshot: false,
          idbLoading: proj.idbLoading,
        }
      case 'empty':
        return {
          data: undefined,
          snapshotUpdatedAt: null as string | null,
          hasSnapshot: false,
          idbLoading: proj.idbLoading,
        }
      case 'snapshot':
        return {
          data: proj.snapshot ?? undefined,
          snapshotUpdatedAt: proj.snapshotUpdatedAt,
          hasSnapshot: true,
          idbLoading: proj.idbLoading,
        }
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
    switch (proj.phase) {
      case 'live':
        return {
          data: live,
          snapshotUpdatedAt: null as string | null,
          hasSnapshot: proj.idbLoading ? Boolean(live) : false,
          idbLoading: proj.idbLoading,
        }
      case 'empty':
        return {
          data: undefined,
          snapshotUpdatedAt: null as string | null,
          hasSnapshot: false,
          idbLoading: proj.idbLoading,
        }
      case 'snapshot':
        return {
          data: proj.snapshot ?? undefined,
          snapshotUpdatedAt: proj.snapshotUpdatedAt,
          hasSnapshot: proj.snapshot != null,
          idbLoading: proj.idbLoading,
        }
    }
  }, [proj, live])
}
