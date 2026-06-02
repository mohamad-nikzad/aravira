import { useEffect, useRef, useState } from 'react'
import type { DependencyList } from 'react'
import type { DataClient } from '@repo/data-client'
import {
  useManagerDataClient,
  useManagerOfflineDataEpoch,
} from '#/lib/manager-data-client'

/**
 * Offline Projection (see CONTEXT.md): a route shows live server data when the
 * IndexedDB snapshot has not hydrated yet, falls back to nothing when offline,
 * and switches to the snapshot once it loads. The precedence rules live here so
 * every route shares one implementation instead of four copies.
 */
export type OfflineProjectionPhase = 'live' | 'empty' | 'snapshot'

/**
 * Pure precedence rule shared by every offline-backed route. Kept side-effect
 * free so it can be unit-tested without a React tree.
 */
export function selectOfflineProjectionPhase(input: {
  enabled: boolean
  hasClient: boolean
  isOnline: boolean
  loaded: boolean
}): { phase: OfflineProjectionPhase; idbLoading: boolean } {
  const { enabled, hasClient, isOnline, loaded } = input
  if (!enabled || !hasClient) return { phase: 'live', idbLoading: false }
  if (!loaded) return { phase: isOnline ? 'live' : 'empty', idbLoading: true }
  return { phase: 'snapshot', idbLoading: false }
}

export type OfflineProjectionConfig<TSnapshot> = {
  enabled: boolean
  isOnline: boolean
  /**
   * Reactive values the hydrate/read closures depend on (date range, ids, live
   * query data). The provider's client/epoch and `enabled`/`isOnline` are added
   * automatically — list only the route's own sources here.
   */
  deps: DependencyList
  /** Push the latest server data into IndexedDB. Only invoked while online. */
  hydrate: (client: DataClient) => Promise<void>
  /** Read the current snapshot back out of IndexedDB. */
  read: (
    client: DataClient,
  ) => Promise<{ snapshot: TSnapshot; updatedAt: string | null }>
}

export type OfflineProjectionResult<TSnapshot> = {
  phase: OfflineProjectionPhase
  /** Non-null only in the `snapshot` phase. */
  snapshot: TSnapshot | null
  snapshotUpdatedAt: string | null
  idbLoading: boolean
}

export function useOfflineProjection<TSnapshot>(
  config: OfflineProjectionConfig<TSnapshot>,
): OfflineProjectionResult<TSnapshot> {
  const { enabled, isOnline, deps } = config
  const client = useManagerDataClient()
  const offlineDataEpoch = useManagerOfflineDataEpoch()

  const [repo, setRepo] = useState<{
    loaded: boolean
    snapshot: TSnapshot | null
    updatedAt: string | null
  }>({ loaded: false, snapshot: null, updatedAt: null })

  const hydrateRef = useRef(config.hydrate)
  const readRef = useRef(config.read)
  hydrateRef.current = config.hydrate
  readRef.current = config.read

  useEffect(() => {
    if (!enabled || !client) {
      setRepo({ loaded: false, snapshot: null, updatedAt: null })
      return
    }

    const ac = new AbortController()
    void (async () => {
      if (isOnline) await hydrateRef.current(client)
      const { snapshot, updatedAt } = await readRef.current(client)
      if (ac.signal.aborted) return
      setRepo({ loaded: true, snapshot, updatedAt })
    })()

    return () => {
      ac.abort()
    }
  }, [enabled, client, isOnline, offlineDataEpoch, ...deps])

  const { phase, idbLoading } = selectOfflineProjectionPhase({
    enabled,
    hasClient: Boolean(client),
    isOnline,
    loaded: repo.loaded,
  })

  return {
    phase,
    snapshot: phase === 'snapshot' ? repo.snapshot : null,
    snapshotUpdatedAt: phase === 'snapshot' ? repo.updatedAt : null,
    idbLoading,
  }
}
