import { useEffect, useRef, useState } from 'react'
import type { DependencyList } from 'react'
import type { DataClient } from '@repo/data-client'
import {
  useManagerDataClient,
  useManagerOfflineDataEpoch,
} from '#/lib/manager-data-client'
import { readSnapshot, writeSnapshot } from '#/lib/offline-snapshot'

/**
 * UI Offline Projection: what a route shows as network and local cache state
 * change (live server data → empty while offline → persisted snapshot).
 *
 * Not to be confused with `@repo/data-client` list projection, which merges
 * pending mutations into manager collection reads.
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

/** Shared metadata every route adapter exposes to banners and empty states. */
export type OfflineProjectionMeta = {
  phase: OfflineProjectionPhase
  idbLoading: boolean
  snapshotUpdatedAt: string | null
  hasSnapshot: boolean
}

export function offlineProjectionMeta(
  proj: Pick<
    OfflineProjectionResult<unknown>,
    'phase' | 'idbLoading' | 'snapshotUpdatedAt'
  >,
  hasSnapshot: boolean,
): OfflineProjectionMeta {
  return {
    phase: proj.phase,
    idbLoading: proj.idbLoading,
    snapshotUpdatedAt:
      proj.phase === 'snapshot' ? proj.snapshotUpdatedAt : null,
    hasSnapshot,
  }
}

/** Resolved value for the current phase plus banner/empty-state metadata. */
export type OfflineProjectionDisplay<T> = OfflineProjectionMeta & {
  value: T | undefined
}

/**
 * Maps a projection result and live/snapshot sources into one display contract.
 * Routes may still overlay live query data on `value` when online (see today).
 */
export function toOfflineProjectionDisplay<T, TSnapshot>(
  proj: Pick<
    OfflineProjectionResult<TSnapshot>,
    'phase' | 'idbLoading' | 'snapshotUpdatedAt' | 'snapshot'
  >,
  options: {
    live: T | undefined
    fromSnapshot: (snapshot: TSnapshot | null) => T | undefined
    hasSnapshot?: (snapshot: TSnapshot | null) => boolean
  },
): OfflineProjectionDisplay<T> {
  const { live, fromSnapshot, hasSnapshot } = options

  switch (proj.phase) {
    case 'live':
      return {
        ...offlineProjectionMeta(proj, false),
        value: live,
      }
    case 'empty':
      return {
        ...offlineProjectionMeta(proj, false),
        value: undefined,
      }
    case 'snapshot': {
      const value = fromSnapshot(proj.snapshot)
      const has =
        hasSnapshot?.(proj.snapshot) ??
        (value !== undefined && value !== null)
      return {
        ...offlineProjectionMeta(proj, has),
        value,
      }
    }
  }
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

/** Manager routes: hydrate/read via DataClient + IndexedDB. */
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

export type LocalStorageOfflineProjectionConfig<T> = {
  enabled: boolean
  isOnline: boolean
  storageKey: string | null
  liveData: T | undefined
  deps?: DependencyList
}

/** Staff (and similar) routes: hydrate/read via localStorage snapshots. */
export function useLocalStorageOfflineProjection<T>(
  config: LocalStorageOfflineProjectionConfig<T>,
): OfflineProjectionResult<T> {
  const { enabled, isOnline, storageKey, liveData, deps = [] } = config
  const hasClient = typeof window !== 'undefined'

  const [repo, setRepo] = useState<{
    loaded: boolean
    snapshot: T | null
    updatedAt: string | null
  }>({ loaded: false, snapshot: null, updatedAt: null })

  useEffect(() => {
    if (!enabled || !storageKey) {
      setRepo({ loaded: false, snapshot: null, updatedAt: null })
      return
    }
    const stored = readSnapshot<T>(storageKey)
    setRepo({
      loaded: true,
      snapshot: stored?.data ?? null,
      updatedAt: stored?.updatedAt ?? null,
    })
  }, [enabled, storageKey, ...deps])

  useEffect(() => {
    if (!enabled || !storageKey || !isOnline || liveData === undefined) return
    const written = writeSnapshot(storageKey, liveData)
    if (written) {
      setRepo({
        loaded: true,
        snapshot: written.data,
        updatedAt: written.updatedAt,
      })
    }
  }, [enabled, storageKey, isOnline, liveData, ...deps])

  const { phase, idbLoading } = selectOfflineProjectionPhase({
    enabled,
    hasClient,
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
