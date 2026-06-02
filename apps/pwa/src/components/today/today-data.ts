import type { TodayData } from '@repo/salon-core/types'

/** Prefer offline projection, then live API payload (manager IndexedDB / staff localStorage). */
export function pickTodayDisplayData(
  projected: TodayData | undefined,
  live: TodayData | undefined,
): TodayData | undefined {
  return projected ?? live
}

export function todayLoadingWithoutData(
  queryLoading: boolean,
  projectionLoading: boolean,
  displayData: TodayData | undefined,
): boolean {
  return (queryLoading || projectionLoading) && !displayData
}
