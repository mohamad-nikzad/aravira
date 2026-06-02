import { useMutation } from '@tanstack/react-query'
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import type { DataClient } from '@repo/data-client'

import { useRequiredManagerDataClient } from '#/lib/manager-data-client'
import {
  assertOnlineForWrite,
  getWritePolicy
  
} from '#/lib/manager-write-policy'
import type {ManagerWriteOperation} from '#/lib/manager-write-policy';
import { useNetworkStatus } from '#/lib/network-status'

export type { ManagerWriteOperation } from '#/lib/manager-write-policy'
export {
  assertOnlineForWrite,
  getWritePolicy,
  MANAGER_WRITE_POLICIES,
  OFFLINE_WRITE_BLOCKED_MESSAGE,
  writePolicyQueuesOffline,
  writePolicyRequiresOnline,
} from '#/lib/manager-write-policy'

type DataClientMutationFn<TData, TVariables> = (
  dataClient: DataClient,
  variables: TVariables,
) => Promise<TData>

type ApiMutationFn<TData, TVariables> = (
  variables: TVariables,
) => Promise<TData>

type ManagerWriteMutationConfig<TData, TVariables> = Omit<
  UseMutationOptions<TData, unknown, TVariables>,
  'mutationFn'
> & {
  dataClientFn?: DataClientMutationFn<TData, TVariables>
  apiFn?: ApiMutationFn<TData, TVariables>
}

function missingAdapterMessage(
  operation: ManagerWriteOperation,
  expected: 'dataClientFn' | 'apiFn',
): string {
  return `useManagerWriteMutation("${operation}") requires ${expected} for policy "${getWritePolicy(operation)}"`
}

/**
 * Unified manager write hook: picks DataClient + queue flush vs API-only
 * from the write policy table.
 */
export function useManagerWriteMutation<TData, TVariables = void>(
  operation: ManagerWriteOperation,
  config: ManagerWriteMutationConfig<TData, TVariables>,
): UseMutationResult<TData, unknown, TVariables> {
  const dataClient = useRequiredManagerDataClient()
  const isOnline = useNetworkStatus()
  const { dataClientFn, apiFn, ...options } = config
  const policy = getWritePolicy(operation)

  return useMutation<TData, unknown, TVariables>({
    ...options,
    mutationFn: async (variables) => {
      assertOnlineForWrite(operation, isOnline)

      switch (policy) {
        case 'queue-offline': {
          if (!dataClientFn) {
            throw new Error(missingAdapterMessage(operation, 'dataClientFn'))
          }
          const result = await dataClientFn(dataClient, variables)
          void dataClient.sync.processPending()
          return result
        }
        case 'require-online': {
          if (!apiFn) {
            throw new Error(missingAdapterMessage(operation, 'apiFn'))
          }
          return apiFn(variables)
        }
      }
    },
  })
}

/** @deprecated Prefer `useManagerWriteMutation` with an explicit operation. */
export function useManagerMutation<TData, TVariables = void>(
  operation: ManagerWriteOperation,
  mutationFn: DataClientMutationFn<TData, TVariables>,
  options?: Omit<
    UseMutationOptions<TData, unknown, TVariables>,
    'mutationFn'
  >,
): UseMutationResult<TData, unknown, TVariables> {
  return useManagerWriteMutation(operation, {
    ...options,
    dataClientFn: mutationFn,
  })
}
