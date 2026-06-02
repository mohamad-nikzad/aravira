import { useMutation } from '@tanstack/react-query'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { DataClient } from '@repo/data-client'

import { useRequiredManagerDataClient } from '#/lib/manager-data-client'

type ManagerMutationFn<TData, TVariables> = (
  dataClient: DataClient,
  variables: TVariables,
) => Promise<TData>

// Single write seam for manager mutations: injects the (always-present) data
// client and flushes queued writes once the mutation succeeds. The global
// MutationCache still owns toasts, invalidation, and error display.
export function useManagerMutation<TData, TVariables = void>(
  mutationFn: ManagerMutationFn<TData, TVariables>,
  options?: Omit<
    UseMutationOptions<TData, unknown, TVariables>,
    'mutationFn'
  >,
): UseMutationResult<TData, unknown, TVariables> {
  const dataClient = useRequiredManagerDataClient()

  return useMutation<TData, unknown, TVariables>({
    ...options,
    mutationFn: async (variables) => {
      const result = await mutationFn(dataClient, variables)
      void dataClient.sync.processPending()
      return result
    },
  })
}
