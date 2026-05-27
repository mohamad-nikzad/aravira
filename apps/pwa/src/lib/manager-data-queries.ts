import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Service,
  ServiceAddon,
  ServiceCategory,
  ServiceFamily,
} from '@repo/salon-core/types'

import {
  comboComponentsQueryKey,
  managerAddonsQueryKey,
  managerBusinessSettingsQueryKey,
  managerServiceCatalogQueryKey,
  managerServicesQueryKey,
  managerStaffQueryKey,
  staffScheduleBundleQueryKey,
} from '#/lib/query-keys'
import { useManagerDataClient } from '#/lib/manager-data-client'

export type ManagerServiceCatalog = {
  categories: ServiceCategory[]
  families: ServiceFamily[]
  services: Service[]
}

export function useManagerStaffQuery(enabled = true) {
  const dc = useManagerDataClient()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: managerStaffQueryKey,
    queryFn: () => dc!.staff.list(),
    enabled: enabled && !!dc,
  })

  useEffect(() => {
    if (!dc) return
    return dc.staff.subscribe((list) => {
      queryClient.setQueryData(managerStaffQueryKey, list)
    })
  }, [dc, queryClient])

  return query
}

export function useManagerServicesQuery(enabled = true) {
  const dc = useManagerDataClient()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: managerServicesQueryKey,
    queryFn: () => dc!.services.list(),
    enabled: enabled && !!dc,
  })

  useEffect(() => {
    if (!dc) return
    return dc.services.subscribe((list) => {
      queryClient.setQueryData(managerServicesQueryKey, list)
    })
  }, [dc, queryClient])

  return query
}

export function useManagerServiceCatalogQuery(enabled = true) {
  const dc = useManagerDataClient()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: managerServiceCatalogQueryKey,
    queryFn: async (): Promise<ManagerServiceCatalog> => {
      const [categories, families, services] = await Promise.all([
        dc!.services.categories.list({ includeInactive: true }),
        dc!.services.families.list({ includeInactive: true }),
        dc!.services.list({ includeInactive: true }),
      ])
      return { categories, families, services }
    },
    enabled: enabled && !!dc,
  })

  useEffect(() => {
    if (!dc) return
    return dc.services.subscribe((services) => {
      queryClient.setQueryData(
        managerServiceCatalogQueryKey,
        (current: ManagerServiceCatalog | undefined) =>
          current ? { ...current, services } : current,
      )
    })
  }, [dc, queryClient])

  return query
}

export function useManagerAddonsQuery(enabled = true) {
  const dc = useManagerDataClient()

  return useQuery({
    queryKey: managerAddonsQueryKey,
    queryFn: (): Promise<ServiceAddon[]> =>
      dc!.services.addons.list({ includeInactive: true }),
    enabled: enabled && !!dc,
  })
}

export function useManagerBusinessSettingsQuery(enabled = true) {
  const dc = useManagerDataClient()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: managerBusinessSettingsQueryKey,
    queryFn: () => dc!.businessSettings.get(),
    enabled: enabled && !!dc,
  })

  useEffect(() => {
    if (!dc) return
    return dc.businessSettings.subscribe((settings) => {
      queryClient.setQueryData(managerBusinessSettingsQueryKey, settings)
    })
  }, [dc, queryClient])

  return query
}

export function useStaffScheduleBundleQuery(
  staffId: string | undefined,
  open: boolean,
) {
  const dc = useManagerDataClient()

  return useQuery({
    queryKey: staffScheduleBundleQueryKey(staffId ?? ''),
    queryFn: () => dc!.staff.getScheduleBundle(staffId!),
    enabled: open && !!staffId && !!dc,
  })
}

export function useComboComponentsQuery(
  serviceId: string | undefined,
  open: boolean,
  isCombo: boolean,
) {
  const dc = useManagerDataClient()

  return useQuery({
    queryKey: comboComponentsQueryKey(serviceId ?? ''),
    queryFn: () => dc!.services.comboComponents.get(serviceId!),
    enabled: open && !!serviceId && isCombo && !!dc,
  })
}
