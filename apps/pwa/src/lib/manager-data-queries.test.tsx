// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

import {
  managerReadQueryKeys,
  managerServicesQueryKey,
  managerStaffQueryKey,
} from '#/lib/query-keys'

describe('manager read query keys', () => {
  it('uses distinct manager-scoped keys for staff and services', () => {
    expect(managerReadQueryKeys.staff).toEqual(['manager', 'staff'])
    expect(managerReadQueryKeys.services).toEqual(['manager', 'services'])
  })

  it('invalidates each collection independently in the shared cache', () => {
    const queryClient = new QueryClient()
    const staff = [{ id: 'staff-1' }]
    const services = [{ id: 'service-1' }]

    queryClient.setQueryData(managerStaffQueryKey, staff)
    queryClient.setQueryData(managerServicesQueryKey, services)

    void queryClient.invalidateQueries({ queryKey: managerStaffQueryKey })

    expect(queryClient.getQueryState(managerStaffQueryKey)?.isInvalidated).toBe(
      true,
    )
    expect(
      queryClient.getQueryState(managerServicesQueryKey)?.isInvalidated,
    ).toBeFalsy()
  })
})
