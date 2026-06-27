import {
  getApiV1AdminSalonsByIdAppointmentRequestsOptions,
  getApiV1AdminSalonsByIdClientsOptions,
  getApiV1AdminSalonsByIdServicesOptions,
  getApiV1AdminSalonsByIdStaffOptions,
} from '@repo/api-client/query'
import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'
import type { ColumnDef, PaginationState } from '@tanstack/react-table'
import { useState } from 'react'

import { ErrorPanel } from '#/components/admin/error-panel'
import { ScreenSkeleton } from '#/components/admin/screen-skeleton'
import { DataTable } from '#/components/data-table/data-table'
import { DataTablePagination } from '#/components/data-table/data-table-pagination'
import { DataTableToolbar } from '#/components/data-table/data-table-toolbar'

import {
  useClientColumns,
  useRequestColumns,
  useServiceColumns,
  useStaffColumns,
  type RecordRow,
} from './salon-columns'
import { Panel } from '#/components/admin/panel'

type SalonOpsTab = 'clients' | 'requests' | 'staff' | 'services'

type ListParams = {
  page: number
  pageSize: number
  search?: string
}

type ListResult = {
  items: RecordRow[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

type AdminListQueryOptions = UseQueryOptions<
  ListResult,
  unknown,
  ListResult,
  readonly unknown[]
>

export function SalonTenantDataPage({
  salonId,
  tab,
}: {
  salonId: string
  tab: SalonOpsTab
}) {
  const clientColumns = useClientColumns()
  const requestColumns = useRequestColumns()
  const staffColumns = useStaffColumns()
  const serviceColumns = useServiceColumns()

  const config = {
    clients: {
      title: 'مشتریان',
      columns: clientColumns,
      loadingLabel: 'در حال بارگذاری مشتریان',
      queryOptionsFor: (params: ListParams) =>
        getApiV1AdminSalonsByIdClientsOptions({
          path: { id: salonId },
          query: params,
        }),
      emptyCopy: 'مشتری‌ای برای این سالن ثبت نشده است.',
    },
    requests: {
      title: 'درخواست‌های نوبت',
      columns: requestColumns,
      loadingLabel: 'در حال بارگذاری درخواست‌های نوبت',
      queryOptionsFor: (params: ListParams) =>
        getApiV1AdminSalonsByIdAppointmentRequestsOptions({
          path: { id: salonId },
          query: params,
        }),
      emptyCopy: 'درخواست نوبتی برای این سالن ثبت نشده است.',
    },
    staff: {
      title: 'پرسنل',
      columns: staffColumns,
      loadingLabel: 'در حال بارگذاری پرسنل',
      queryOptionsFor: (params: ListParams) =>
        getApiV1AdminSalonsByIdStaffOptions({
          path: { id: salonId },
          query: params,
        }),
      emptyCopy: 'پرسنلی برای این سالن ثبت نشده است.',
    },
    services: {
      title: 'خدمات',
      columns: serviceColumns,
      loadingLabel: 'در حال بارگذاری خدمات',
      queryOptionsFor: (params: ListParams) =>
        getApiV1AdminSalonsByIdServicesOptions({
          path: { id: salonId },
          query: params,
        }),
      emptyCopy: 'خدمتی برای این سالن ثبت نشده است.',
    },
  }[tab]

  return (
    <Panel title={config.title}>
      <TenantListContent
        columns={config.columns}
        loadingLabel={config.loadingLabel}
        queryOptionsFor={config.queryOptionsFor}
        emptyCopy={config.emptyCopy}
      />
    </Panel>
  )
}

function TenantListContent({
  columns,
  loadingLabel,
  queryOptionsFor,
  emptyCopy,
}: {
  columns: ColumnDef<RecordRow>[]
  loadingLabel: string
  queryOptionsFor: (params: ListParams) => unknown
  emptyCopy: string
}) {
  const [query, setQuery] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const listQuery = useQuery(
    queryOptionsFor({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: query || undefined,
    }) as AdminListQueryOptions,
  )
  const total = listQuery.data?.pagination.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize))
  const rows = listQuery.data?.items ?? []

  return (
    <div className="space-y-3">
      <DataTableToolbar
        query={query}
        onQueryChange={(nextQuery) => {
          setQuery(nextQuery)
          setPagination((current) => ({ ...current, pageIndex: 0 }))
        }}
        onReset={() => {
          setQuery('')
          setPagination((current) => ({ ...current, pageIndex: 0 }))
        }}
      />
      {listQuery.isLoading ? <ScreenSkeleton label={loadingLabel} /> : null}
      {listQuery.isError ? (
        <ErrorPanel
          message="بارگذاری داده‌های سالن ناموفق بود."
          onRetry={() => void listQuery.refetch()}
        />
      ) : null}
      {!listQuery.isLoading && !listQuery.isError && rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyCopy}</p>
      ) : null}
      {!listQuery.isLoading && !listQuery.isError ? (
        <>
          <DataTable
            columns={columns}
            data={rows}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
          <DataTablePagination
            pagination={pagination}
            pageCount={pageCount}
            onPaginationChange={setPagination}
          />
        </>
      ) : null}
    </div>
  )
}
