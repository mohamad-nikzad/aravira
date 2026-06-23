import {
  getApiV1AdminSalonsOptions,
  getApiV1AdminSalonsQueryKey,
  postApiV1AdminSalonsMutation,
} from '@repo/api-client/query'
import type { AdminSetupSalonCreateRequest } from '@repo/api-client/types'
import { hasPlatformPermission } from '@repo/auth/platform'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { AdminListTable } from '#/components/admin/admin-list-table'
import { FormField, TextAreaField } from '#/components/admin/form-field'
import {
  LiveConfirmationInput,
  LiveDataWarning,
  liveConfirmationFromForm,
} from '#/components/admin/live-data-form'
import { MutationError } from '#/components/admin/mutation-error'
import { AdminPageHeader } from '#/components/layout/admin-page-header'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { useAdminAuth } from '#/context/admin-auth-provider'

import { useSalonsListColumns } from './salon-columns'

export function SalonsListPage() {
  return (
    <>
      <AdminPageHeader
        title="سالن‌ها"
        description="جستجو، وضعیت پلتفرم و عملیات داخلی سالن‌های Saluna."
      />
      <SalonsListScreen />
    </>
  )
}

export function SalonsListScreen() {
  const columns = useSalonsListColumns()
  const queryClient = useQueryClient()
  const { me, runtime } = useAdminAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const canCreate = hasPlatformPermission(me.role, 'manage_salons')
  const createMutation = useMutation({
    ...postApiV1AdminSalonsMutation(),
    onSuccess: () => {
      setCreateOpen(false)
      void queryClient.invalidateQueries({
        queryKey: getApiV1AdminSalonsQueryKey(),
      })
    },
  })

  return (
    <>
      <AdminListTable
        from="/_admin/salons/"
        columns={columns}
        queryOptionsFor={(params) =>
          getApiV1AdminSalonsOptions({ query: params })
        }
        hint="جستجو بر اساس نام سالن، شناسه یا شماره تلفن..."
        loadingLabel="در حال بارگذاری سالن‌ها"
        errorMessage="بارگذاری سالن‌ها ناموفق بود."
        toolbarActions={
          canCreate ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              سالن راه‌اندازی جدید
            </Button>
          ) : null
        }
      />
      <SetupSalonDialog
        open={createOpen}
        isLiveData={runtime.dataSource === 'live'}
        error={createMutation.error}
        pending={createMutation.isPending}
        onOpenChange={setCreateOpen}
        onSubmit={(body) => createMutation.mutate({ body })}
      />
    </>
  )
}

function SetupSalonDialog({
  open,
  isLiveData,
  error,
  pending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  isLiveData: boolean
  error: unknown
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (body: AdminSetupSalonCreateRequest) => void
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSubmit({
      name: String(form.get('name') ?? ''),
      intendedOwnerPhone: String(form.get('intendedOwnerPhone') ?? ''),
      reason: String(form.get('reason') ?? ''),
      liveConfirmation: liveConfirmationFromForm(form, isLiveData),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ایجاد سالن راه‌اندازی</DialogTitle>
          <DialogDescription>
            سالن بدون حساب مالک ساخته می‌شود و تا تحویل به مالک عمومی نیست.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <LiveDataWarning
            show={isLiveData}
            message="این سالن در داده LIVE تولید ساخته می‌شود. برای ادامه LIVE را وارد کنید."
          />
          <FormField label="نام سالن" name="name" required />
          <FormField
            label="شماره تلفن مالک موردنظر"
            name="intendedOwnerPhone"
            placeholder="۰۹۱۲۱۲۳۴۵۶۷"
            type="tel"
            required
          />
          <TextAreaField
            label="دلیل"
            name="reason"
            placeholder="دلیل ایجاد برای گزارش ممیزی الزامی است"
            rows={3}
            required
          />
          <LiveConfirmationInput show={isLiveData} />
          <MutationError error={error} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              <Plus data-icon="inline-start" />
              ایجاد سالن راه‌اندازی
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
