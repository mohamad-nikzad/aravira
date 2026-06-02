import { useMemo } from 'react'
import type { TodayData } from '@repo/salon-core/types'
import {
  toOfflineProjectionDisplay,
  useLocalStorageOfflineProjection
  
} from '#/lib/offline-projection'
import type {OfflineProjectionDisplay} from '#/lib/offline-projection';

function staffTodayStorageKey(date: string) {
  return `today:staff:${date}`
}

export function useStaffTodayOfflineProjection(input: {
  enabled: boolean
  isOnline: boolean
  todayDate: string
  tomorrowDate: string
  todayLive: TodayData | undefined
  tomorrowLive: TodayData | undefined
}): {
  today: OfflineProjectionDisplay<TodayData>
  tomorrow: OfflineProjectionDisplay<TodayData>
} {
  const {
    enabled,
    isOnline,
    todayDate,
    tomorrowDate,
    todayLive,
    tomorrowLive,
  } = input

  const todayProj = useLocalStorageOfflineProjection<TodayData>({
    enabled,
    isOnline,
    storageKey: enabled ? staffTodayStorageKey(todayDate) : null,
    liveData: todayLive,
    deps: [todayDate],
  })

  const tomorrowProj = useLocalStorageOfflineProjection<TodayData>({
    enabled,
    isOnline,
    storageKey: enabled ? staffTodayStorageKey(tomorrowDate) : null,
    liveData: tomorrowLive,
    deps: [tomorrowDate],
  })

  return useMemo(
    () => ({
      today: toOfflineProjectionDisplay(todayProj, {
        live: todayLive,
        fromSnapshot: (s) => s ?? undefined,
        hasSnapshot: (s) => s != null,
      }),
      tomorrow: toOfflineProjectionDisplay(tomorrowProj, {
        live: tomorrowLive,
        fromSnapshot: (s) => s ?? undefined,
        hasSnapshot: (s) => s != null,
      }),
    }),
    [todayProj, tomorrowProj, todayLive, tomorrowLive],
  )
}
