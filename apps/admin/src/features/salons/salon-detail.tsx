import {
  getApiV1AdminOverviewQueryKey,
  getApiV1AdminSalonsByIdNotesOptions,
  getApiV1AdminSalonsByIdNotesQueryKey,
  getApiV1AdminSalonsByIdOptions,
  getApiV1AdminSalonsByIdQueryKey,
  getApiV1AdminSalonsByIdSetupOptions,
  getApiV1AdminSalonsByIdSetupQueryKey,
  getApiV1AdminSalonsQueryKey,
  patchApiV1AdminSalonsByIdSetupHoursMutation,
  patchApiV1AdminSalonsByIdSetupPresenceMutation,
  patchApiV1AdminSalonsByIdStatusMutation,
  postApiV1AdminSalonsByIdNotesMutation,
} from '@repo/api-client/query'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ErrorPanel } from '#/components/admin/error-panel'
import {
  MutationSuccess,
  useMutationSuccess,
} from '#/components/admin/mutation-success'
import { ScreenSkeleton } from '#/components/admin/screen-skeleton'
import { AdminPageHeader } from '#/components/layout/admin-page-header'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { useAdminAuth } from '#/context/admin-auth-provider'
import { number, text } from '#/lib/admin-format'

import { normalizeStatus, StatusBadge, truthy } from './salon-columns'
import { NotesPanel, StatusForm } from './salon-governance'
import { CompactRows, DetailGrid, Panel } from '#/components/admin/panel'
import { SalonTenantDataTabs } from './salon-tenant-tabs'
import { SalonSetupEditor } from './salon-setup-editor'
import { SalonSetupCatalog } from './salon-setup-catalog'
import { SalonSetupStaff } from './salon-setup-staff'
import { SalonSetupClients } from './salon-setup-clients'
import {
  useSalonDetailUrlState,
  type SalonDetailSection,
} from './salon-url-state'

export function SalonDetailPage({ salonId }: { salonId: string }) {
  const detailQuery = useQuery(
    getApiV1AdminSalonsByIdOptions({ path: { id: salonId } }),
  )
  const salonName = text(detailQuery.data?.salon?.name) || undefined

  return (
    <>
      <div className="space-y-3">
        <SalonDetailBreadcrumbs salonName={salonName} />
        <AdminPageHeader
          title={salonName || 'جزئیات سالن'}
          description="بررسی هویت سالن، اقدامات حاکمیتی و داده‌های عملیاتی."
        />
      </div>
      <SalonDetailScreen salonId={salonId} />
    </>
  )
}

function SalonDetailBreadcrumbs({ salonName }: { salonName?: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/salons">سالن‌ها</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{salonName || 'جزئیات سالن'}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export function SalonDetailScreen({ salonId }: { salonId: string }) {
  const queryClient = useQueryClient()
  const { me, runtime } = useAdminAuth()
  const { successMessage, showSuccess } = useMutationSuccess()
  const { tab, subtab, setTab, setSubtab } = useSalonDetailUrlState()
  const isLiveData = runtime.dataSource === 'live'
  const detailQuery = useQuery(
    getApiV1AdminSalonsByIdOptions({ path: { id: salonId } }),
  )
  const notesQuery = useQuery(
    getApiV1AdminSalonsByIdNotesOptions({ path: { id: salonId } }),
  )
  const canManageSetup =
    me.role === 'platform_owner' || me.role === 'platform_admin'
  const setupQuery = useQuery({
    ...getApiV1AdminSalonsByIdSetupOptions({ path: { id: salonId } }),
    enabled: detailQuery.data?.salon?.status === 'setup' && canManageSetup,
  })
  const statusMutation = useMutation({
    ...patchApiV1AdminSalonsByIdStatusMutation(),
    onSuccess: () => {
      showSuccess('وضعیت سالن به‌روزرسانی شد.')
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
      showSuccess('یادداشت افزوده شد.')
      void queryClient.invalidateQueries({
        queryKey: getApiV1AdminSalonsByIdNotesQueryKey({
          path: { id: salonId },
        }),
      })
      void queryClient.invalidateQueries({
        queryKey: getApiV1AdminSalonsByIdQueryKey({ path: { id: salonId } }),
      })
      void queryClient.invalidateQueries({
        queryKey: getApiV1AdminOverviewQueryKey(),
      })
    },
  })
  const hoursMutation = useMutation({
    ...patchApiV1AdminSalonsByIdSetupHoursMutation(),
    onSuccess: () => {
      showSuccess('ساعت کاری سالن ذخیره شد.')
      void queryClient.invalidateQueries({
        queryKey: getApiV1AdminSalonsByIdSetupQueryKey({
          path: { id: salonId },
        }),
      })
    },
  })
  const presenceMutation = useMutation({
    ...patchApiV1AdminSalonsByIdSetupPresenceMutation(),
    onSuccess: () => {
      showSuccess('حضور سالن ذخیره شد.')
      void queryClient.invalidateQueries({
        queryKey: getApiV1AdminSalonsByIdSetupQueryKey({
          path: { id: salonId },
        }),
      })
    },
  })

  if (detailQuery.isLoading) {
    return <ScreenSkeleton label="در حال بارگذاری سالن" />
  }
  if (detailQuery.isError) {
    return (
      <ErrorPanel
        message="بارگذاری جزئیات سالن ناموفق بود."
        onRetry={() => void detailQuery.refetch()}
      />
    )
  }

  const salon = detailQuery.data?.salon ?? {}
  const currentStatus = normalizeStatus(salon.status)

  return (
    <div className="space-y-5">
      <MutationSuccess message={successMessage} />
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as SalonDetailSection)}
        className="space-y-4"
      >
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="governance">حاکمیت</TabsTrigger>
          <TabsTrigger value="operations">عملیات</TabsTrigger>
          {currentStatus === 'setup' && canManageSetup ? (
            <TabsTrigger value="setup">آماده‌سازی</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Panel title="هویت سالن">
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
                ['شماره تلفن', text(salon.phone)],
                [
                  'تلفن مالک موردنظر',
                  text(salon.intendedOwnerPhone) || 'ثبت نشده',
                ],
                ['منطقه زمانی', text(salon.timezone)],
                [
                  'صفحه عمومی',
                  truthy(salon.publicEnabled) ? 'فعال' : 'غیرفعال',
                ],
              ]}
            />
          </Panel>
          <Panel title="آمار">
            <DetailGrid
              items={[
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
        </TabsContent>

        <TabsContent value="governance" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
            {currentStatus === 'setup' ? (
              <Panel title="وضعیت راه‌اندازی">
                <p className="text-sm leading-6 text-muted-foreground">
                  این سالن تا تحویل به مالک در وضعیت راه‌اندازی باقی می‌ماند و
                  از این صفحه فعال نمی‌شود.
                </p>
              </Panel>
            ) : (
              <StatusForm
                current={currentStatus}
                error={statusMutation.error}
                isLiveData={isLiveData}
                pending={statusMutation.isPending}
                onSubmit={(input, options) =>
                  statusMutation.mutate(
                    { path: { id: salonId }, body: input },
                    options,
                  )
                }
              />
            )}
            <NotesPanel
              error={noteMutation.error}
              isError={notesQuery.isError}
              isLoading={notesQuery.isLoading}
              notes={notesQuery.data?.notes ?? []}
              pending={noteMutation.isPending}
              onRetry={() => void notesQuery.refetch()}
              onSubmit={(input, options) =>
                noteMutation.mutate(
                  { path: { id: salonId }, body: input },
                  options,
                )
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="operations">
          <SalonTenantDataTabs
            salonId={salonId}
            activeTab={subtab}
            onTabChange={setSubtab}
          />
        </TabsContent>

        {currentStatus === 'setup' && canManageSetup ? (
          <TabsContent value="setup">
            {setupQuery.isLoading ? (
              <ScreenSkeleton label="در حال بارگذاری تنظیمات راه‌اندازی" />
            ) : null}
            {setupQuery.isError ? (
              <ErrorPanel
                message="بارگذاری تنظیمات راه‌اندازی ناموفق بود."
                onRetry={() => void setupQuery.refetch()}
              />
            ) : null}
            {setupQuery.data ? (
              <div className="space-y-4">
                <SalonSetupEditor
                  configuration={setupQuery.data}
                  hoursError={hoursMutation.error}
                  presenceError={presenceMutation.error}
                  hoursPending={hoursMutation.isPending}
                  presencePending={presenceMutation.isPending}
                  isLiveData={isLiveData}
                  onSaveHours={(body, options) =>
                    hoursMutation.mutate(
                      { path: { id: salonId }, body },
                      options,
                    )
                  }
                  onSavePresence={(body, options) =>
                    presenceMutation.mutate(
                      { path: { id: salonId }, body },
                      options,
                    )
                  }
                />
                <SalonSetupCatalog salonId={salonId} isLiveData={isLiveData} />
                <SalonSetupStaff salonId={salonId} isLiveData={isLiveData} />
                <SalonSetupClients salonId={salonId} isLiveData={isLiveData} />
              </div>
            ) : null}
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
