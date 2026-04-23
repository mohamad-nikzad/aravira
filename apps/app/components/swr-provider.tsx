'use client'

import { SWRConfig } from 'swr'

const swrConfig = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  errorRetryCount: 2,
  errorRetryInterval: 5000,
  shouldRetryOnError: () =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
}

export function SwrProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
}
