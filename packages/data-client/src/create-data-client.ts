import { createFetchHttpTransport } from './adapters/http/fetch-http-transport'
import { IndexedDbLocalDataPort } from './adapters/indexeddb/indexed-db-local-data-port'
import { MemoryLocalDataPort } from './adapters/memory/memory-local-data-port'
import { NullLocalDataPort } from './ports/local-data-port'
import type { HttpTransportPort } from './ports/http-transport'
import { composeDataClient, type DataClient } from './core/compose-data-client'
import { KvMutationQueue } from './core/mutation-queue'

export type DataClientPersistence = 'online-only' | 'memory' | 'indexeddb'

export interface CreateDataClientConfig {
  persistence: DataClientPersistence
  /** Prepended to request paths (default `''` for same-origin `/api/...`). */
  basePath?: string
  fetchImpl?: typeof fetch
  /** Supply a custom transport (e.g. tests). Overrides `basePath` / `fetchImpl`. */
  transport?: HttpTransportPort
  /** Options when `persistence` is `indexeddb`. */
  indexedDb?: { databaseName?: string }
  /** When false, mutations always go to the network (default: true except `online-only`). */
  offlineWrites?: boolean
  /** Override online detection (defaults to `navigator.onLine` in the browser). */
  isOnline?: () => boolean
}

export function createDataClient(config: CreateDataClientConfig): DataClient {
  const transport =
    config.transport ??
    createFetchHttpTransport({
      basePath: config.basePath,
      fetchImpl: config.fetchImpl,
    })

  const storage =
    config.persistence === 'memory'
      ? new MemoryLocalDataPort()
      : config.persistence === 'indexeddb'
        ? new IndexedDbLocalDataPort(config.indexedDb)
        : new NullLocalDataPort()

  const offlineWrites =
    config.offlineWrites ??
    (config.persistence === 'memory' || config.persistence === 'indexeddb')
  const mutationQueue = offlineWrites ? new KvMutationQueue(storage) : null
  const isOnline = config.isOnline

  return composeDataClient({ transport, storage, mutationQueue, isOnline })
}
