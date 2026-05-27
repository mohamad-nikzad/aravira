import { useQuery } from '@tanstack/react-query'
import type { ServiceAddon } from '@repo/salon-core/types'
import type { DataClient } from '@repo/data-client'

import { api } from '#/lib/api-client'
import { serviceAddonsQueryKey } from '#/lib/query-keys'
import { useManagerDataClient } from '#/lib/manager-data-client'

async function fetchServiceAddons(
  serviceId: string,
  dataClient: DataClient | null,
  signal?: AbortSignal,
): Promise<ServiceAddon[]> {
  if (dataClient) {
    return dataClient.services.addons.forService(serviceId)
  }
  const response = await api.services.addons.forService(serviceId, { signal })
  return response.addons
}

export function useServiceAddons(serviceId: string, enabled: boolean) {
  const dataClient = useManagerDataClient()

  return useQuery({
    queryKey: serviceAddonsQueryKey(serviceId),
    queryFn: ({ signal }) => fetchServiceAddons(serviceId, dataClient, signal),
    enabled: enabled && !!serviceId,
  })
}
