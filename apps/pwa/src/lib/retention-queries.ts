import { queryOptions, useMutation } from '@tanstack/react-query'
import { getApiV1Retention } from '@repo/api-client/sdk'
import {
  getApiV1RetentionQueryKey,
  patchApiV1RetentionByIdMutation,
  postApiV1RetentionByIdBaleMessageMutation,
} from '@repo/api-client/query'
import type {
  FollowUpStatus,
  RetentionItem,
  RetentionListResponse,
  RetentionBaleMessageResponse,
} from '@repo/api-client/types'

import { HEAVY_QUERY_STALE_TIME_MS } from '#/lib/query-client'

export { getApiV1RetentionQueryKey }
export type {
  FollowUpStatus,
  RetentionItem,
  RetentionListResponse,
  RetentionBaleMessageResponse,
}

export function retentionInvalidationKeys() {
  return [[{ _id: 'getApiV1Retention' }]] as const
}

export function retentionListQueryOptions() {
  return queryOptions({
    queryKey: getApiV1RetentionQueryKey(),
    staleTime: HEAVY_QUERY_STALE_TIME_MS,
    queryFn: async ({ signal }): Promise<RetentionListResponse> => {
      const { data } = await getApiV1Retention({
        signal,
        throwOnError: true,
      })
      return data
    },
  })
}

export function useUpdateRetentionStatusMutation() {
  const generated = patchApiV1RetentionByIdMutation()

  return useMutation({
    mutationFn: async (
      { id, status }: { id: string; status: FollowUpStatus },
      mutationContext,
    ) => {
      return generated.mutationFn!(
        {
          path: { id },
          body: { status },
        },
        mutationContext,
      )
    },
    meta: {
      skipToast: true,
      invalidatesQuery: retentionInvalidationKeys(),
    },
  })
}

export function useSendRetentionBaleMessageMutation() {
  const generated = postApiV1RetentionByIdBaleMessageMutation()

  return useMutation({
    mutationFn: async (
      { id, retry }: { id: string; retry?: boolean },
      mutationContext,
    ): Promise<RetentionBaleMessageResponse> => {
      return generated.mutationFn!(
        {
          path: { id },
          ...(retry ? { body: { retry: true } } : {}),
        },
        mutationContext,
      )
    },
    meta: {
      skipToast: true,
    },
  })
}
