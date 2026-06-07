import { queryOptions, useMutation } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import type { PresencePayload } from '@repo/salon-core/forms/presence'
import { getApiV1SalonProfilePresence } from '@repo/api-client/sdk'
import {
  getApiV1SalonProfilePresenceQueryKey,
  patchApiV1SalonProfilePresenceMutation,
} from '@repo/api-client/query'
import type {
  SalonPresence,
  SalonPresenceResponse,
} from '@repo/api-client/types'

import { HEAVY_QUERY_STALE_TIME_MS } from '#/lib/query-client'

export { getApiV1SalonProfilePresenceQueryKey }
export type { SalonPresence, SalonPresenceResponse }

export function salonPresenceQueryOptions() {
  return queryOptions({
    queryKey: getApiV1SalonProfilePresenceQueryKey(),
    staleTime: HEAVY_QUERY_STALE_TIME_MS,
    queryFn: async ({ signal }): Promise<SalonPresenceResponse> => {
      const { data } = await getApiV1SalonProfilePresence({
        signal,
        throwOnError: true,
      })
      return data
    },
  })
}

export function useUpdateSalonPresenceMutation(
  invalidatesQuery:
    | QueryKey
    | readonly QueryKey[] = getApiV1SalonProfilePresenceQueryKey(),
) {
  const generated = patchApiV1SalonProfilePresenceMutation()

  return useMutation({
    mutationFn: async (
      values: PresencePayload,
      mutationContext,
    ): Promise<SalonPresenceResponse> => {
      return generated.mutationFn!({ body: values }, mutationContext)
    },
    meta: {
      skipToast: true,
      invalidatesQuery,
    },
  })
}
