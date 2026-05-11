import type { TodayData } from '@repo/salon-core/types'
import type { ApiClient } from './client'
import { endpoints } from './endpoints'

export function createTodayApi(client: ApiClient) {
  return {
    get(date?: string, opts: { signal?: AbortSignal } = {}) {
      const path = date ? `${endpoints.today}?date=${encodeURIComponent(date)}` : endpoints.today
      return client.request<TodayData>(path, { signal: opts.signal })
    },
  }
}

export type TodayApi = ReturnType<typeof createTodayApi>
