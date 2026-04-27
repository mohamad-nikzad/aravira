'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createDataClient, type DataClient } from '@repo/data-client'
import { ManagerSyncBar } from '@/components/manager-sync-bar'

type ManagerDataContextValue = {
  client: DataClient | null
  offlineDataEpoch: number
  bumpOfflineData: () => void
}

const ManagerDataClientContext = createContext<ManagerDataContextValue | null>(null)

export function ManagerDataClientProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<DataClient | null>(null)
  const [offlineDataEpoch, setOfflineDataEpoch] = useState(0)

  const bumpOfflineData = useCallback(() => {
    setOfflineDataEpoch((n) => n + 1)
  }, [])

  const ctx = useMemo(
    () => ({
      client,
      offlineDataEpoch,
      bumpOfflineData,
    }),
    [client, offlineDataEpoch, bumpOfflineData]
  )

  useEffect(() => {
    setClient(createDataClient({ persistence: 'indexeddb' }))
  }, [])

  useEffect(() => {
    if (!client) return
    const run = () => {
      void client.sync.processPending()
    }
    const onOnline = () => run()
    const onVis = () => {
      if (document.visibilityState === 'visible') run()
    }
    const onFocus = () => run()
    window.addEventListener('online', onOnline)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    run()
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [client])

  return (
    <ManagerDataClientContext.Provider value={ctx}>
      <div className="flex min-h-0 flex-1 flex-col">
        <ManagerSyncBar />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </ManagerDataClientContext.Provider>
  )
}

export function useManagerDataClient(): DataClient | null {
  return useContext(ManagerDataClientContext)?.client ?? null
}

export function useManagerOfflineDataEpoch(): number {
  return useContext(ManagerDataClientContext)?.offlineDataEpoch ?? 0
}

export function useBumpOfflineData(): () => void {
  return useContext(ManagerDataClientContext)?.bumpOfflineData ?? (() => {})
}
