import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { TodayData } from '@repo/salon-core/types'
import { addDaysYmd, salonTodayYmd } from '@repo/salon-core/salon-local-time'

import { api } from '#/lib/api-client'
import { useNetworkStatus } from '#/lib/network-status'
import { firstNameOf } from '#/lib/today-view-model'
import { useStaffTodayOfflineProjection } from '#/lib/use-staff-today-offline-projection'
import {
  StaffTodayContext
  
} from '#/components/today/staff-today-context'
import type {StaffTodayContextValue} from '#/components/today/staff-today-context';
import {
  pickTodayDisplayData,
  todayLoadingWithoutData,
} from '#/components/today/today-data'

export function StaffTodayProvider({
  userName,
  enabled,
  children,
}: {
  userName: string
  /** Mirrors route gate: only staff role fetches today API. */
  enabled: boolean
  children: React.ReactNode
}) {
  const isOnline = useNetworkStatus()
  const todayDate = useMemo(() => salonTodayYmd(), [])
  const tomorrowDate = useMemo(() => addDaysYmd(todayDate, 1), [todayDate])

  const todayQuery = useQuery<TodayData>({
    queryKey: ['today', 'staff', todayDate],
    queryFn: ({ signal }) => api.today.get(todayDate, { signal }),
    enabled,
  })

  const tomorrowQuery = useQuery<TodayData>({
    queryKey: ['today', 'staff', tomorrowDate],
    queryFn: ({ signal }) => api.today.get(tomorrowDate, { signal }),
    enabled,
  })

  const offline = useStaffTodayOfflineProjection({
    enabled,
    isOnline,
    todayDate,
    tomorrowDate,
    todayLive: todayQuery.data,
    tomorrowLive: tomorrowQuery.data,
  })

  const todayData = pickTodayDisplayData(
    offline.today.value,
    todayQuery.data,
  )
  const tomorrowData = pickTodayDisplayData(
    offline.tomorrow.value,
    tomorrowQuery.data,
  )

  const value = useMemo<StaffTodayContextValue>(
    () => ({
      state: {
        todayDate,
        tomorrowDate,
        todayData,
        tomorrowData,
        todayLoading: todayLoadingWithoutData(
          todayQuery.isLoading,
          offline.today.idbLoading,
          todayData,
        ),
        tomorrowLoading: todayLoadingWithoutData(
          tomorrowQuery.isLoading,
          offline.tomorrow.idbLoading,
          tomorrowData,
        ),
        todayError: todayQuery.error,
        tomorrowError: tomorrowQuery.error,
        todaySnapshotUpdatedAt: offline.today.snapshotUpdatedAt,
        tomorrowSnapshotUpdatedAt: offline.tomorrow.snapshotUpdatedAt,
        hasTodaySnapshot: offline.today.hasSnapshot,
        hasTomorrowSnapshot: offline.tomorrow.hasSnapshot,
        isOnline,
        staffName: firstNameOf(userName),
      },
      actions: {
        mutateToday: () => void todayQuery.refetch(),
        mutateTomorrow: () => void tomorrowQuery.refetch(),
      },
    }),
    [
      todayDate,
      tomorrowDate,
      todayData,
      tomorrowData,
      todayQuery.isLoading,
      tomorrowQuery.isLoading,
      todayQuery.error,
      tomorrowQuery.error,
      todayQuery.refetch,
      tomorrowQuery.refetch,
      offline,
      isOnline,
      userName,
    ],
  )

  return <StaffTodayContext value={value}>{children}</StaffTodayContext>
}
