import {
  getApiV1AdminPlatformAdminsOptions,
  getApiV1AdminPlatformAdminsQueryKey,
  patchApiV1AdminPlatformAdminsByIdMutation,
  postApiV1AdminPlatformAdminsMutation,
} from '@repo/api-client/query'
import type { PlatformRole } from '@repo/api-client/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Eye, LockKeyhole, Plus, ShieldCheck, UserRound } from 'lucide-react'

import { AdminListTable } from '#/components/admin/admin-list-table'
import { CheckboxField, TextAreaField } from '#/components/admin/form-field'
import {
  LiveConfirmationInput,
  LiveDataWarning,
  liveConfirmationFromForm,
} from '#/components/admin/live-data-form'
import { MutationError } from '#/components/admin/mutation-error'
import {
  MutationSuccess,
  useMutationSuccess,
} from '#/components/admin/mutation-success'
import { DetailGrid, Panel } from '#/components/admin/panel'
import { RoleBadge } from '#/components/admin/role-badge'
import { SelectField } from '#/components/admin/select-field'
import { UserPicker } from '#/components/admin/user-picker'
import { AdminPageHeader } from '#/components/layout/admin-page-header'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { useAdminAuth } from '#/context/admin-auth-provider'
import { BooleanBadge } from '#/components/admin/boolean-badge'
import { PrimaryCell } from '#/components/admin/primary-cell'
import { formatDate, text } from '#/lib/admin-format'

type RecordRow = Record<string, unknown>

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
    <div className="flex flex-col gap-4">
      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="نشست" icon={<UserRound className="h-4 w-4" />}>
          <DetailGrid
            items={[
              ['نام', me.name],
              ['ایمیل', me.email],
              ['تلفن', me.phoneNumber],
              [
                'نقش',
                <RoleBadge key="role" role={me.role} active={me.active} />,
              ],
            ]}
          />
        </Panel>
        <Panel title="مدل دسترسی" icon={<LockKeyhole className="h-4 w-4" />}>
          <div className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
            <p>
              دسترسی ادمین با نقش‌های پلتفرم و نشست کوکی احراز هویت کنترل
              می‌شود.
            </p>
            <p>
              فهرست شماره‌های راه‌اندازی اولیه فقط برای راه‌اندازی اولیه یا
              بازیابی اضطراری مالک پلتفرم است؛ پس از آن، دسترسی از همین بخش
              تنظیمات مدیریت می‌شود.
            </p>
          </div>
        </Panel>
      </section>
      {isPlatformOwner ? (
        <Panel
          title="ادمین‌های پلتفرم"
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
  const { successMessage, showSuccess } = useMutationSuccess()
  const [selected, setSelected] = useState<RecordRow | null | 'new'>(null)
  const columns = useMemo<ColumnDef<RecordRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'ادمین',
        cell: ({ row }) => (
          <PrimaryCell
            title={text(row.original.name)}
            subtitle={
              text(row.original.email) || text(row.original.phoneNumber)
            }
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
            falseLabel="لغو شده"
          />
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'به‌روزرسانی',
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
      <MutationSuccess message={successMessage} />
      <AdminListTable
        from="/_admin/settings"
        columns={columns}
        queryOptionsFor={(params) =>
          getApiV1AdminPlatformAdminsOptions({ query: params })
        }
        hint="جستجو بر اساس نام، ایمیل، تلفن یا نام کاربری..."
        loadingLabel="در حال بارگذاری رکوردهای ادمین"
        errorMessage="بارگذاری رکوردهای ادمین ناموفق بود."
        toolbarActions={
          <Button size="sm" onClick={() => setSelected('new')}>
            <Plus className="h-4 w-4" />
            اعطای دسترسی
          </Button>
        }
      />
      <PlatformAdminSheet
        admin={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onSaved={() => {
          showSuccess('دسترسی ادمین پلتفرم ذخیره شد.')
          void queryClient.invalidateQueries({
            queryKey: getApiV1AdminPlatformAdminsQueryKey(),
          })
        }}
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
            محافظت از آخرین مالک فعال در سمت سرور اعمال می‌شود.
          </SheetDescription>
        </SheetHeader>
        <form className="mt-6 flex flex-col gap-4" onSubmit={submit}>
          <LiveDataWarning
            show={isLiveData}
            message="این تغییر دسترسی روی داده LIVE تولید اعمال می‌شود. برای ادامه LIVE را وارد کنید."
          />
          <UserPicker
            name="userId"
            required={isNew}
            readOnly={!isNew}
            displayUser={
              isNew
                ? undefined
                : {
                    userId: text(source.userId),
                    name: text(source.name),
                    email: text(source.email),
                    phoneNumber: text(source.phoneNumber),
                  }
            }
          />
          <SelectField
            label="نقش"
            name="role"
            defaultValue={text(source.role) || 'platform_viewer'}
            options={roleOptions}
          />
          <CheckboxField
            label="دسترسی فعال"
            name="active"
            defaultChecked={source.active !== false}
          />
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

function truthy(value: unknown): boolean {
  return value === true || value === 'true' || value === 1
}
