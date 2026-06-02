// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

import {
  managerClientsQueryKey,
  managerReadQueryKeys,
  managerServicesQueryKey,
  managerStaffQueryKey,
} from '#/lib/query-keys'

describe('manager read query keys', () => {
  it('uses distinct manager-scoped keys for staff, services, and clients', () => {
    expect(managerReadQueryKeys.staff).toEqual(['manager', 'staff'])
    expect(managerReadQueryKeys.services).toEqual(['manager', 'services'])
    expect(managerReadQueryKeys.clients).toEqual(['manager', 'clients'])
  })

  it('invalidates each collection independently in the shared cache', () => {
    const queryClient = new QueryClient()
    const staff = [{ id: 'staff-1' }]
    const services = [{ id: 'service-1' }]
    const clients = [{ id: 'client-1' }]

    queryClient.setQueryData(managerStaffQueryKey, staff)
    queryClient.setQueryData(managerServicesQueryKey, services)
    queryClient.setQueryData(managerClientsQueryKey, clients)

    void queryClient.invalidateQueries({ queryKey: managerStaffQueryKey })

    expect(queryClient.getQueryState(managerStaffQueryKey)?.isInvalidated).toBe(
      true,
    )
    expect(
      queryClient.getQueryState(managerServicesQueryKey)?.isInvalidated,
    ).toBeFalsy()
    expect(
      queryClient.getQueryState(managerClientsQueryKey)?.isInvalidated,
    ).toBeFalsy()
  })
})
