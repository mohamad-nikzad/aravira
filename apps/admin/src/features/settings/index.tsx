import {
  getApiV1AdminPlatformAdminsOptions,
  getApiV1AdminPlatformAdminsQueryKey,
  patchApiV1AdminPlatformAdminsByIdMutation,
  postApiV1AdminPlatformAdminsMutation,
} from '@repo/api-client/query'
import type { PlatformRole } from '@repo/api-client/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'
import type { ColumnDef, PaginationState } from '@tanstack/react-table'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { CircleAlert, Eye, LockKeyhole, Plus, ShieldCheck, UserRound } from 'lucide-react'

import { DataTable } from '#/components/data-table/data-table'
import { DataTablePagination } from '#/components/data-table/data-table-pagination'
import { DataTableToolbar } from '#/components/data-table/data-table-toolbar'
import { AdminPageHeader } from '#/components/layout/admin-page-header'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Skeleton } from '#/components/ui/skeleton'
import { useAdminAuth } from '#/context/admin-auth-provider'
import { useTableUrlState } from '#/hooks/use-table-url-state'
import { cn } from '#/lib/utils'

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

const roleOptions: Array<[PlatformRole, string]> = [
  ['platform_owner', 'مالک'],
  ['platform_admin', 'ادمین'],
  ['platform_support', 'پشتیبان'],
  ['platform_viewer', 'بیننده'],
]

export function SettingsPage() {
  return (
    <>
      <AdminPageHeader
        title="تنظیمات"
        description="تنظیمات داخلی ادمین، نشست و مدیریت دسترسی پلتفرم."
      />
      <SettingsScreen />
    </>
  )
}

function SettingsScreen() {
  const { me } = useAdminAuth()
  const isPlatformOwner = me.role === 'platform_owner'

  return (
    <div className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="نشست" icon={<UserRound className="h-4 w-4" />}>
          <DetailGrid
            items={[
              ['Name', me.name],
              ['ایمیل', me.email],
              ['موبایل', me.phoneNumber],
              [
                'نقش',
                <RoleBadge key="role" role={me.role} active={me.active} />,
              ],
            ]}
          />
        </Panel>
        <Panel title="مدل دسترسی" icon={<LockKeyhole className="h-4 w-4" />}>
          <div className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              دسترسی ادمین با نقش‌های پلتفرمی و نشست کوکی Better Auth کنترل
              می‌شود.
            </p>
            <p>
              متغیر PLATFORM_ADMIN_BOOTSTRAP_PHONES فقط برای بوت‌استرپ اولیه یا
              بازیابی اضطراری مالک پلتفرم است؛ بعد از بوت‌استرپ، دسترسی‌ها از
              همین بخش تنظیمات مدیریت می‌شوند.
            </p>
          </div>
        </Panel>
      </section>
      {isPlatformOwner ? (
        <Panel
          title="Platform Admins"
          icon={<ShieldCheck className="h-4 w-4" />}
        >
          <PlatformAdminsScreen />
        </Panel>
      ) : null}
    </div>
  )
}

function PlatformAdminsScreen() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<RecordRow | null | 'new'>(null)
  const columns = useMemo<ColumnDef<RecordRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'ادمین',
        cell: ({ row }) => (
          <PrimaryCell
            title={text(row.original.name)}
            subtitle={text(row.original.email) || text(row.original.phoneNumber)}
          />
        ),
      },
      {
        accessorKey: 'role',
        header: 'نقش',
        cell: ({ row }) => (
          <RoleBadge
            role={text(row.original.role)}
            active={truthy(row.original.active)}
          />
        ),
      },
      {
        accessorKey: 'active',
        header: 'دسترسی',
        cell: ({ row }) => (
          <BooleanBadge
            value={truthy(row.original.active)}
            trueLabel="فعال"
            falseLabel="لغوشده"
          />
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'به‌روزشده',
        cell: ({ row }) => formatDate(row.original.updatedAt),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <RowButton label="مدیریت" onClick={() => setSelected(row.original)} />
        ),
      },
    ],
    [],
  )

  return (
    <>
      <AdminListTable
        columns={columns}
        queryOptionsFor={(params) =>
          getApiV1AdminPlatformAdminsOptions({ query: params })
        }
        searchPlaceholder="جستجو بر اساس نام، ایمیل، موبایل یا نام کاربری..."
        actions={
          <Button size="sm" onClick={() => setSelected('new')}>
            <Plus className="h-4 w-4" />
            اعطای دسترسی
          </Button>
        }
      />
      <PlatformAdminSheet
        admin={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onSaved={() =>
          void queryClient.invalidateQueries({
            queryKey: getApiV1AdminPlatformAdminsQueryKey(),
          })
        }
      />
    </>
  )
}

function PlatformAdminSheet({
  admin,
  onOpenChange,
  onSaved,
}: {
  admin: RecordRow | null | 'new'
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const isNew = admin === 'new'
  const { runtime } = useAdminAuth()
  const isLiveData = runtime.dataSource === 'live'
  const source = admin && admin !== 'new' ? admin : {}
  const createMutation = useMutation({
    ...postApiV1AdminPlatformAdminsMutation(),
    onSuccess: () => {
      onSaved()
      onOpenChange(false)
    },
  })
  const updateMutation = useMutation({
    ...patchApiV1AdminPlatformAdminsByIdMutation(),
    onSuccess: () => {
      onSaved()
      onOpenChange(false)
    },
  })
  const activeMutation = isNew ? createMutation : updateMutation

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const body = {
      userId: String(form.get('userId') ?? ''),
      role: String(form.get('role') ?? 'platform_viewer') as PlatformRole,
      active: form.get('active') === 'on',
      reason: String(form.get('reason') ?? ''),
      liveConfirmation: liveConfirmationFromForm(form, isLiveData),
    }
    if (isNew) {
      createMutation.mutate({ body })
      return
    }
    updateMutation.mutate({
      path: { id: text(source.id) },
      body: {
        role: body.role,
        active: body.active,
        reason: body.reason,
        liveConfirmation: body.liveConfirmation,
      },
    })
  }

  return (
    <Sheet open={Boolean(admin)} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {isNew ? 'اعطای دسترسی پلتفرم' : 'مدیریت ادمین پلتفرم'}
          </SheetTitle>
          <SheetDescription>
            محافظت از آخرین مالک فعال در API اعمال می‌شود.
          </SheetDescription>
        </SheetHeader>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <LiveDataWarning
            show={isLiveData}
            message="این تغییر دسترسی ادمین روی داده زنده تولید اعمال می‌شود."
          />
          <FormField
            label="شناسه کاربر"
            name="userId"
            defaultValue={text(source.userId)}
            required
            readOnly={!isNew}
          />
          <SelectField
            label="نقش"
            name="role"
            defaultValue={text(source.role) || 'platform_viewer'}
            options={roleOptions}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              name="active"
              type="checkbox"
              defaultChecked={source.active !== false}
            />
            دسترسی فعال
          </label>
          <TextAreaField label="دلیل" name="reason" rows={3} required />
          <LiveConfirmationInput show={isLiveData} />
          <MutationError error={activeMutation.error} />
          <Button disabled={activeMutation.isPending} type="submit">
            <ShieldCheck className="h-4 w-4" />
            ذخیره دسترسی
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function AdminListTable({
  columns,
  queryOptionsFor,
  searchPlaceholder,
  actions,
}: {
  columns: ColumnDef<RecordRow>[]
  queryOptionsFor: (params: ListParams) => unknown
  searchPlaceholder: string
  actions?: ReactNode
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <DataTableToolbar
          query={tableState.query}
          onQueryChange={(query) => setTableState({ query, page: 1 })}
          onReset={() => setTableState({ query: '', page: 1, sort: '' })}
        />
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <p className="text-xs text-muted-foreground">{searchPlaceholder}</p>
      {listQuery.isLoading ? <ScreenSkeleton /> : null}
      {listQuery.isError ? (
        <ErrorPanel message="بارگذاری رکوردهای ادمین انجام نشد." />
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

function Panel({
  title,
  icon,
  children,
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-border/80 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/80 px-4 py-3">
        {icon ? <span className="text-muted-foreground/85">{icon}</span> : null}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function DetailGrid({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <div className="grid gap-3 rounded-lg border border-border/80 bg-card p-4 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 truncate text-sm font-medium">
            {value || '-'}
          </div>
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

function RowButton({
  label = 'مشاهده',
  icon = <Eye className="h-4 w-4" />,
  onClick,
}: {
  label?: string
  icon?: ReactNode
  onClick: () => void
}) {
  return (
    <Button size="sm" variant="ghost" onClick={onClick}>
      {icon}
      {label}
    </Button>
  )
}

function FormField({
  label,
  name,
  defaultValue,
  placeholder,
  pattern,
  type = 'text',
  required,
  readOnly,
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  pattern?: string
  type?: string
  required?: boolean
  readOnly?: boolean
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        pattern={pattern}
        required={required}
        readOnly={readOnly}
      />
    </label>
  )
}

function TextAreaField({
  label,
  name,
  defaultValue,
  placeholder,
  rows,
  required,
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  rows: number
  required?: boolean
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </label>
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
    <label className={cn('block space-y-1.5 text-sm')}>
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

function RoleBadge({ role, active }: { role: string; active: boolean }) {
  if (!role) return <Badge variant="outline">بدون نقش پلتفرمی</Badge>
  return (
    <Badge variant={active ? 'default' : 'outline'}>{formatRole(role)}</Badge>
  )
}

function LiveDataWarning({
  show,
  message,
}: {
  show: boolean
  message: string
}) {
  if (!show) return null
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/35 bg-destructive/10 p-3 text-sm text-destructive">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="leading-6">{message} برای ادامه عبارت LIVE را وارد کنید.</p>
    </div>
  )
}

function LiveConfirmationInput({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <FormField
      label="تأیید داده زنده"
      name="liveConfirmation"
      placeholder="LIVE"
      pattern="LIVE"
      required
    />
  )
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

function ScreenSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <Skeleton className="h-5 w-52" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

function liveConfirmationFromForm(form: FormData, isLiveData: boolean) {
  if (!isLiveData) return undefined
  return String(form.get('liveConfirmation') ?? '')
}

function formatRole(role: string) {
  const roles: Record<string, string> = {
    platform_owner: 'مالک',
    platform_admin: 'ادمین',
    platform_support: 'پشتیبان',
    platform_viewer: 'بیننده',
  }
  return roles[role] ?? role
}

function text(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  return ''
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
