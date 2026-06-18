import {
  getApiV1AdminOverviewQueryKey,
  getApiV1AdminSalonsByIdNotesOptions,
  getApiV1AdminSalonsByIdNotesQueryKey,
  getApiV1AdminSalonsByIdOptions,
  getApiV1AdminSalonsByIdQueryKey,
  getApiV1AdminSalonsOptions,
  getApiV1AdminSalonsQueryKey,
  patchApiV1AdminSalonsByIdStatusMutation,
  postApiV1AdminSalonsByIdNotesMutation,
} from '@repo/api-client/query'
import type {
  AdminNoteCreateRequest,
  AdminNotesResponse,
  AdminSalonStatus,
  AdminSalonStatusUpdateRequest,
} from '@repo/api-client/types'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'
import type { ColumnDef, PaginationState } from '@tanstack/react-table'
import { ArrowRight, CircleAlert, Eye, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { DataTable } from '#/components/data-table/data-table'
import { DataTablePagination } from '#/components/data-table/data-table-pagination'
import { DataTableToolbar } from '#/components/data-table/data-table-toolbar'
import { AdminPageHeader } from '#/components/layout/admin-page-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'
import { useAdminAuth } from '#/context/admin-auth-provider'
import { useTableUrlState } from '#/hooks/use-table-url-state'

type RecordRow = Record<string, unknown>

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

export function SalonsListPage() {
  return (
    <>
      <AdminPageHeader
        title="سالن‌ها"
        description="جستجو، وضعیت پلتفرمی و عملیات داخلی سالن‌های Saluna."
      />
      <SalonsListScreen />
    </>
  )
}

export function SalonDetailPage({ salonId }: { salonId: string }) {
  return (
    <>
      <AdminPageHeader
        title="جزئیات سالن"
        description="نمای کلی سالن، وضعیت فعلی و یادداشت‌های داخلی ادمین."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/salons">
              <ArrowRight className="h-4 w-4" />
              بازگشت
            </Link>
          </Button>
        }
      />
      <SalonDetailScreen salonId={salonId} />
    </>
  )
}

export function SalonsListScreen() {
  const columns = useMemo<ColumnDef<RecordRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'سالن',
        cell: ({ row }) => (
          <PrimaryCell
            title={text(row.original.name)}
            subtitle={text(row.original.slug)}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: 'وضعیت',
        cell: ({ row }) => <StatusBadge status={text(row.original.status)} />,
      },
      {
        accessorKey: 'phone',
        header: 'موبایل',
        cell: ({ row }) => <span dir="ltr">{text(row.original.phone)}</span>,
      },
      {
        accessorKey: 'memberCount',
        header: 'اعضا',
        cell: ({ row }) => number(row.original.memberCount),
      },
      {
        accessorKey: 'publicEnabled',
        header: 'صفحه عمومی',
        cell: ({ row }) => (
          <BooleanBadge value={truthy(row.original.publicEnabled)} />
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <Button asChild size="sm" variant="ghost">
            <Link
              to="/salons/$salonId"
              params={{ salonId: text(row.original.id) }}
            >
              <Eye className="h-4 w-4" />
              مشاهده
            </Link>
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <AdminListTable
      columns={columns}
      queryOptionsFor={(params) =>
        getApiV1AdminSalonsOptions({ query: params })
      }
      searchPlaceholder="جستجو بر اساس نام سالن، اسلاگ یا شماره موبایل..."
    />
  )
}

export function SalonDetailScreen({ salonId }: { salonId: string }) {
  const queryClient = useQueryClient()
  const { runtime } = useAdminAuth()
  const isLiveData = runtime.dataSource === 'live'
  const detailQuery = useQuery(
    getApiV1AdminSalonsByIdOptions({ path: { id: salonId } }),
  )
  const notesQuery = useQuery(
    getApiV1AdminSalonsByIdNotesOptions({ path: { id: salonId } }),
  )
  const statusMutation = useMutation({
    ...patchApiV1AdminSalonsByIdStatusMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getApiV1AdminSalonsQueryKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: getApiV1AdminSalonsByIdQueryKey({ path: { id: salonId } }),
      })
      void queryClient.invalidateQueries({
        queryKey: getApiV1AdminOverviewQueryKey(),
      })
    },
  })
  const noteMutation = useMutation({
    ...postApiV1AdminSalonsByIdNotesMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getApiV1AdminSalonsByIdNotesQueryKey({
          path: { id: salonId },
        }),
      })
    },
  })

  if (detailQuery.isLoading)
    return <ScreenSkeleton label="در حال دریافت سالن" />
  if (detailQuery.isError) {
    return <ErrorPanel message="دریافت جزئیات سالن انجام نشد." />
  }

  const salon = detailQuery.data?.salon ?? {}
  const currentStatus = normalizeStatus(salon.status)

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Panel title="Overview">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold">
                  {text(salon.name) || 'سالن بدون نام'}
                </h2>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {text(salon.slug) || salonId}
                </p>
              </div>
              <StatusBadge status={currentStatus} />
            </div>
            <DetailGrid
              items={[
                ['موبایل', text(salon.phone)],
                ['منطقه زمانی', text(salon.timezone)],
                [
                  'صفحه عمومی',
                  truthy(salon.publicEnabled) ? 'فعال' : 'غیرفعال',
                ],
                ['خدمات', number(detailQuery.data?.stats.services)],
                ['نوبت‌ها', number(detailQuery.data?.stats.appointments)],
                ['اعضا', number(detailQuery.data?.members.length)],
              ]}
            />
          </Panel>
          <Panel title="اعضا">
            <CompactRows
              rows={(detailQuery.data?.members ?? []).map((member) => ({
                label: text(member.name),
                value: text(member.role),
                badge: text(member.phoneNumber) || text(member.email),
              }))}
              empty="عضوی برای این سالن ثبت نشده است."
            />
          </Panel>
        </div>

        <StatusForm
          current={currentStatus}
          error={statusMutation.error}
          isLiveData={isLiveData}
          pending={statusMutation.isPending}
          onSubmit={(input) =>
            statusMutation.mutate({ path: { id: salonId }, body: input })
          }
        />
      </section>

      <NotesPanel
        error={noteMutation.error}
        isLoading={notesQuery.isLoading}
        notes={notesQuery.data?.notes ?? []}
        pending={noteMutation.isPending}
        onSubmit={(input) =>
          noteMutation.mutate({ path: { id: salonId }, body: input })
        }
      />
    </div>
  )
}

function AdminListTable({
  columns,
  queryOptionsFor,
  searchPlaceholder,
}: {
  columns: ColumnDef<RecordRow>[]
  queryOptionsFor: (params: ListParams) => unknown
  searchPlaceholder: string
}) {
  const [tableState, setTableState] = useTableUrlState(20)
  const pagination: PaginationState = {
    pageIndex: Math.max(tableState.page - 1, 0),
    pageSize: tableState.pageSize,
  }
  const listQuery = useQuery(
    queryOptionsFor({
      page: tableState.page,
      pageSize: tableState.pageSize,
      search: tableState.query || undefined,
    }) as AdminListQueryOptions,
  )
  const total = listQuery.data?.pagination.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / tableState.pageSize))

  return (
    <section className="space-y-3">
      <DataTableToolbar
        query={tableState.query}
        onQueryChange={(query) => setTableState({ query, page: 1 })}
        onReset={() => setTableState({ query: '', page: 1, sort: '' })}
      />
      <p className="text-xs text-muted-foreground">{searchPlaceholder}</p>
      {listQuery.isLoading ? (
        <ScreenSkeleton label="در حال دریافت سالن‌ها" />
      ) : null}
      {listQuery.isError ? (
        <ErrorPanel message="بارگذاری سالن‌ها انجام نشد." />
      ) : null}
      <DataTable
        columns={columns}
        data={listQuery.data?.items ?? []}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={(next) =>
          setTableState({ page: next.pageIndex + 1, pageSize: next.pageSize })
        }
      />
      <DataTablePagination
        pagination={pagination}
        pageCount={pageCount}
        onPaginationChange={(next) =>
          setTableState({ page: next.pageIndex + 1, pageSize: next.pageSize })
        }
      />
    </section>
  )
}

function StatusForm({
  current,
  error,
  isLiveData,
  pending,
  onSubmit,
}: {
  current: AdminSalonStatus
  error: unknown
  isLiveData: boolean
  pending: boolean
  onSubmit: (input: AdminSalonStatusUpdateRequest) => void
}) {
  const [open, setOpen] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSubmit({
      status: normalizeStatus(form.get('status')),
      reason: String(form.get('reason') ?? ''),
      liveConfirmation: liveConfirmationFromForm(form, isLiveData),
    })
    event.currentTarget.reset()
    setOpen(false)
  }

  return (
    <Panel title="تغییر وضعیت">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">وضعیت فعلی</span>
          <StatusBadge status={current} />
        </div>
        <MutationError error={error} />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" type="button">
              <RefreshCw className="h-4 w-4" />
              تغییر وضعیت
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تغییر وضعیت سالن</DialogTitle>
              <DialogDescription>
                برای ثبت تغییر وضعیت، دلیل ممیزی را وارد کنید.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-3" onSubmit={submit}>
              <LiveDataWarning show={isLiveData} />
              <SelectField
                label="وضعیت"
                name="status"
                defaultValue={current}
                options={[
                  ['active', 'فعال'],
                  ['suspended', 'تعلیق‌شده'],
                  ['archived', 'آرشیوشده'],
                ]}
              />
              <TextAreaField
                label="دلیل"
                name="reason"
                placeholder="دلیل الزامی برای ثبت در ممیزی"
                rows={3}
                required
              />
              <LiveConfirmationInput show={isLiveData} />
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  <RefreshCw className="h-4 w-4" />
                  به‌روزرسانی وضعیت
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Panel>
  )
}

function NotesPanel({
  error,
  isLoading,
  notes,
  pending,
  onSubmit,
}: {
  error: unknown
  isLoading: boolean
  notes: AdminNotesResponse['notes']
  pending: boolean
  onSubmit: (input: AdminNoteCreateRequest) => void
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSubmit({
      body: String(form.get('body') ?? ''),
      reason: String(form.get('reason') ?? ''),
    })
    event.currentTarget.reset()
  }

  return (
    <Panel title="یادداشت‌های داخلی">
      <form className="space-y-3" onSubmit={submit}>
        <TextAreaField label="یادداشت" name="body" rows={3} required />
        <Input name="reason" placeholder="دلیل الزامی برای ممیزی" required />
        <MutationError error={error} />
        <Button type="submit" disabled={pending}>
          <Plus className="h-4 w-4" />
          افزودن یادداشت
        </Button>
      </form>
      <div className="mt-4 space-y-2">
        {isLoading ? <ScreenSkeleton label="در حال دریافت یادداشت‌ها" /> : null}
        {!isLoading && notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            هنوز یادداشتی ثبت نشده است.
          </p>
        ) : null}
        {notes.map((note) => (
          <div key={note.id} className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{note.authorName}</span>
              <span>{formatDate(note.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm leading-6">{note.body}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/80 px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function DetailGrid({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="min-w-0 rounded-md border border-border/70 bg-background/35 px-3 py-2.5"
        >
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 truncate text-sm font-medium">
            {value || '-'}
          </div>
        </div>
      ))}
    </div>
  )
}

function CompactRows({
  rows,
  empty,
}: {
  rows: Array<{ label: string; value: string; badge?: string }>
  empty: string
}) {
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">{empty}</p>
  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div
          key={`${row.label}-${index}`}
          className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-background/35 px-3 py-2.5"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {row.label || '-'}
            </div>
            {row.badge ? (
              <div className="truncate text-xs text-muted-foreground">
                {row.badge}
              </div>
            ) : null}
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function PrimaryCell({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium">{title || '-'}</div>
      {subtitle ? (
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      ) : null}
    </div>
  )
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string
  name: string
  defaultValue: string
  options: Array<[string, string]>
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {options.map(([value, optionLabel]) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextAreaField({
  label,
  name,
  placeholder,
  rows,
  required,
}: {
  label: string
  name: string
  placeholder?: string
  rows: number
  required?: boolean
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <textarea
        name={name}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </label>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') return <Badge variant="success">فعال</Badge>
  if (status === 'suspended') return <Badge variant="warning">تعلیق‌شده</Badge>
  if (status === 'archived') return <Badge variant="danger">آرشیوشده</Badge>
  return <Badge>{status || 'نامشخص'}</Badge>
}

function BooleanBadge({
  value,
  trueLabel = 'بله',
  falseLabel = 'خیر',
}: {
  value: boolean
  trueLabel?: string
  falseLabel?: string
}) {
  return (
    <Badge variant={value ? 'success' : 'outline'}>
      {value ? trueLabel : falseLabel}
    </Badge>
  )
}

function LiveDataWarning({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/35 bg-destructive/10 p-3 text-sm text-destructive">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="leading-6">
        تغییر وضعیت سالن روی داده زنده تولید اعمال می‌شود. برای ادامه عبارت LIVE
        را وارد کنید.
      </p>
    </div>
  )
}

function LiveConfirmationInput({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-muted-foreground">تأیید داده زنده</span>
      <Input
        name="liveConfirmation"
        placeholder="LIVE"
        pattern="LIVE"
        required
      />
    </label>
  )
}

function liveConfirmationFromForm(form: FormData, isLiveData: boolean) {
  if (!isLiveData) return undefined
  return String(form.get('liveConfirmation') ?? '')
}

function MutationError({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <p className="text-sm text-destructive">
      {error instanceof Error ? error.message : 'عملیات انجام نشد'}
    </p>
  )
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      {message}
    </div>
  )
}

function ScreenSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <Skeleton className="h-5 w-52" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

function normalizeStatus(value: unknown): AdminSalonStatus {
  if (value === 'suspended' || value === 'archived') return value
  return 'active'
}

function text(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  return ''
}

function number(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value) || 0
  return 0
}

function truthy(value: unknown): boolean {
  return value === true || value === 'true' || value === 1
}

function formatDate(value: unknown): string {
  const raw = text(value)
  if (!raw) return '-'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
