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
import {
  Clock,
  Handshake,
  Inbox,
  LayoutDashboard,
  MapPin,
  Pencil,
  Scissors,
  ShieldAlert,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { ErrorPanel } from '#/components/admin/error-panel'
import {
  MutationSuccess,
  useMutationSuccess,
} from '#/components/admin/mutation-success'
import { CompactRows, DetailGrid, Panel } from '#/components/admin/panel'
import { ScreenSkeleton } from '#/components/admin/screen-skeleton'
import { AdminPageHeader } from '#/components/layout/admin-page-header'
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb'
import { useAdminAuth } from '#/context/admin-auth-provider'
import { number, text } from '#/lib/admin-format'

import { normalizeStatus, StatusBadge, truthy } from './salon-columns'
import { NotesPanel, StatusForm } from './salon-governance'
import {
  SalonSetupHoursForm,
  SalonSetupPresenceForm,
} from './salon-setup-editor'
import { SalonSetupCatalog } from './salon-setup-catalog'
import { SalonSetupClients } from './salon-setup-clients'
import { SalonSetupHandoff } from './salon-setup-handoff'
import { SalonSetupStaff } from './salon-setup-staff'
import { SalonTenantDataPage } from './salon-tenant-tabs'

export type SalonWorkspaceSection =
  | 'overview'
  | 'edit'
  | 'hours'
  | 'presence'
  | 'staff'
  | 'services'
  | 'clients'
  | 'requests'
  | 'handoff'

type WorkspaceData = ReturnType<typeof useSalonWorkspace> & {
  salon: Record<string, unknown>
}

export function SalonDetailPage({
  salonId,
  section = 'overview',
}: {
  salonId: string
  section?: SalonWorkspaceSection
}) {
  const workspace = useSalonWorkspace(salonId)
  const salonName = text(workspace.detailQuery.data?.salon?.name) || undefined

  return (
    <>
      <div className="space-y-3">
        <SalonDetailBreadcrumbs
          salonId={salonId}
          salonName={salonName}
          currentLabel={WORKSPACE_LABELS[section]}
        />
        <AdminPageHeader
          title={salonName || 'جزئیات سالن'}
          description="فضای کاری سالن برای بررسی، ویرایش و پیگیری بخش‌های اصلی."
        />
      </div>
      <SalonWorkspaceScreen
        workspace={workspace}
        salonId={salonId}
        section={section}
      />
    </>
  )
}

function SalonDetailBreadcrumbs({
  salonId,
  salonName,
  currentLabel,
}: {
  salonId: string
  salonName?: string
  currentLabel: string
}) {
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
          <BreadcrumbLink asChild>
            <Link to="/salons/$salonId" params={{ salonId }}>
              {salonName || 'جزئیات سالن'}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function useSalonWorkspace(salonId: string) {
  const queryClient = useQueryClient()
  const { me, runtime } = useAdminAuth()
  const { successMessage, showSuccess } = useMutationSuccess()
  const [overrideSalonId, setOverrideSalonId] = useState<string | null>(null)
  const isLiveData = runtime.dataSource === 'live'
  const detailQuery = useQuery(
    getApiV1AdminSalonsByIdOptions({ path: { id: salonId } }),
  )
  const notesQuery = useQuery(
    getApiV1AdminSalonsByIdNotesOptions({ path: { id: salonId } }),
  )
  const canManageSetup =
    me.role === 'platform_owner' || me.role === 'platform_admin'
  const detailStatus = normalizeStatus(detailQuery.data?.salon?.status)
  const canEnterOverride =
    me.role === 'platform_owner' && detailStatus === 'active'
  const overrideMode = canEnterOverride && overrideSalonId === salonId
  const setupQuery = useQuery({
    ...getApiV1AdminSalonsByIdSetupOptions({
      path: { id: salonId },
      ...(overrideMode ? { query: { override: true } } : {}),
    }),
    enabled:
      (detailStatus === 'setup' && canManageSetup) || Boolean(overrideMode),
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

  return {
    canEnterOverride,
    canManageSetup,
    detailQuery,
    hoursMutation,
    isLiveData,
    noteMutation,
    notesQuery,
    overrideMode,
    presenceMutation,
    setupQuery,
    statusMutation,
    successMessage,
    setOverrideSalonId,
  }
}

function SalonWorkspaceScreen({
  workspace,
  salonId,
  section,
}: {
  workspace: ReturnType<typeof useSalonWorkspace>
  salonId: string
  section: SalonWorkspaceSection
}) {
  if (workspace.detailQuery.isLoading) {
    return <ScreenSkeleton label="در حال بارگذاری سالن" />
  }
  if (workspace.detailQuery.isError) {
    return (
      <ErrorPanel
        message="بارگذاری جزئیات سالن ناموفق بود."
        onRetry={() => void workspace.detailQuery.refetch()}
      />
    )
  }

  const salon = workspace.detailQuery.data?.salon ?? {}
  const data: WorkspaceData = { ...workspace, salon }

  return (
    <div className="space-y-5">
      <MutationSuccess message={workspace.successMessage} />
      <WorkspaceNav
        salonId={salonId}
        section={section}
        showHandoff={normalizeStatus(salon.status) === 'setup'}
      />
      {section === 'overview' ? (
        <SalonOverviewSection salonId={salonId} data={data} />
      ) : null}
      {section === 'edit' ? <SalonEditSection data={data} /> : null}
      {section === 'hours' ? (
        <SetupSectionGate
          salonId={salonId}
          data={data}
          render={() =>
            data.setupQuery.data ? (
              <SalonSetupHoursForm
                configuration={data.setupQuery.data}
                error={data.hoursMutation.error}
                pending={data.hoursMutation.isPending}
                isLiveData={data.isLiveData}
                onSave={(body, options) =>
                  data.hoursMutation.mutate(
                    {
                      path: { id: salonId },
                      body: {
                        ...body,
                        ...(data.overrideMode ? { override: true } : {}),
                      },
                    },
                    options,
                  )
                }
              />
            ) : null
          }
        />
      ) : null}
      {section === 'presence' ? (
        <SetupSectionGate
          salonId={salonId}
          data={data}
          render={() =>
            data.setupQuery.data ? (
              <SalonSetupPresenceForm
                configuration={data.setupQuery.data}
                error={data.presenceMutation.error}
                pending={data.presenceMutation.isPending}
                isLiveData={data.isLiveData}
                onSave={(body, options) =>
                  data.presenceMutation.mutate(
                    {
                      path: { id: salonId },
                      body: {
                        ...body,
                        ...(data.overrideMode ? { override: true } : {}),
                      },
                    },
                    options,
                  )
                }
              />
            ) : null
          }
        />
      ) : null}
      {section === 'staff' ? (
        <SetupSectionGate
          salonId={salonId}
          data={data}
          fallback={
            <SalonTenantDataPage salonId={salonId} tab="staff" />
          }
          render={() => (
            <SalonSetupStaff
              salonId={salonId}
              isLiveData={data.isLiveData}
              overrideMode={data.overrideMode}
            />
          )}
        />
      ) : null}
      {section === 'services' ? (
        <SetupSectionGate
          salonId={salonId}
          data={data}
          fallback={
            <SalonTenantDataPage salonId={salonId} tab="services" />
          }
          render={() => (
            <SalonSetupCatalog
              salonId={salonId}
              isLiveData={data.isLiveData}
              overrideMode={data.overrideMode}
            />
          )}
        />
      ) : null}
      {section === 'clients' ? (
        <SetupSectionGate
          salonId={salonId}
          data={data}
          fallback={
            <SalonTenantDataPage salonId={salonId} tab="clients" />
          }
          render={() => (
            <SalonSetupClients
              salonId={salonId}
              isLiveData={data.isLiveData}
              overrideMode={data.overrideMode}
            />
          )}
        />
      ) : null}
      {section === 'requests' ? (
        <SalonTenantDataPage salonId={salonId} tab="requests" />
      ) : null}
      {section === 'handoff' ? (
        <SetupSectionGate
          salonId={salonId}
          data={data}
          render={() =>
            data.overrideMode ? (
              <Panel title="تحویل سالن">
                <p className="text-sm leading-6 text-muted-foreground">
                  تحویل برای Override سالن فعال انجام نمی‌شود.
                </p>
              </Panel>
            ) : (
              <SalonSetupHandoff
                salonId={salonId}
                intendedOwnerPhone={text(data.salon.intendedOwnerPhone)}
                isLiveData={data.isLiveData}
              />
            )
          }
        />
      ) : null}
    </div>
  )
}

function SalonOverviewSection({
  data,
}: {
  salonId: string
  data: WorkspaceData
}) {
  const currentStatus = normalizeStatus(data.salon.status)

  return (
    <div className="space-y-4">
      <Panel title="هویت سالن">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">
              {text(data.salon.name) || 'سالن بدون نام'}
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {text(data.salon.slug) || text(data.salon.id)}
            </p>
          </div>
          <StatusBadge status={currentStatus} />
        </div>
        <DetailGrid
          items={[
            ['شماره تلفن', text(data.salon.phone)],
            [
              'تلفن مالک موردنظر',
              text(data.salon.intendedOwnerPhone) || 'ثبت نشده',
            ],
            ['منطقه زمانی', text(data.salon.timezone)],
            ['صفحه عمومی', truthy(data.salon.publicEnabled) ? 'فعال' : 'غیرفعال'],
          ]}
        />
      </Panel>
      <Panel title="آمار">
        <DetailGrid
          items={[
            ['خدمات', number(data.detailQuery.data?.stats.services)],
            ['نوبت‌ها', number(data.detailQuery.data?.stats.appointments)],
            ['اعضا', number(data.detailQuery.data?.members.length)],
          ]}
        />
      </Panel>
      <Panel title="اعضا">
        <CompactRows
          rows={(data.detailQuery.data?.members ?? []).map((member) => ({
            label: text(member.name),
            value: text(member.role),
            badge: text(member.phoneNumber) || text(member.email),
          }))}
          empty="عضوی برای این سالن ثبت نشده است."
        />
      </Panel>
    </div>
  )
}

function SalonEditSection({ data }: { data: WorkspaceData }) {
  const currentStatus = normalizeStatus(data.salon.status)

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <Panel title="اطلاعات سالن">
        <DetailGrid
          items={[
            ['نام سالن', text(data.salon.name)],
            ['شناسه عمومی', text(data.salon.slug)],
            ['شماره تلفن', text(data.salon.phone)],
            ['منطقه زمانی', text(data.salon.timezone)],
            ['وضعیت', WORKSPACE_STATUS_LABELS[currentStatus]],
          ]}
        />
      </Panel>
      <div className="space-y-4">
        {currentStatus === 'setup' ? (
          <Panel title="وضعیت راه‌اندازی">
            <p className="text-sm leading-6 text-muted-foreground">
              این سالن تا تحویل به مالک در وضعیت راه‌اندازی باقی می‌ماند و از
              این صفحه فعال نمی‌شود.
            </p>
          </Panel>
        ) : (
          <StatusForm
            current={currentStatus}
            error={data.statusMutation.error}
            isLiveData={data.isLiveData}
            pending={data.statusMutation.isPending}
            onSubmit={(input, options) =>
              data.statusMutation.mutate(
                { path: { id: text(data.salon.id) }, body: input },
                options,
              )
            }
          />
        )}
        <NotesPanel
          error={data.noteMutation.error}
          isError={data.notesQuery.isError}
          isLoading={data.notesQuery.isLoading}
          notes={data.notesQuery.data?.notes ?? []}
          pending={data.noteMutation.isPending}
          onRetry={() => void data.notesQuery.refetch()}
          onSubmit={(input, options) =>
            data.noteMutation.mutate(
              { path: { id: text(data.salon.id) }, body: input },
              options,
            )
          }
        />
      </div>
    </div>
  )
}

function SetupSectionGate({
  salonId,
  data,
  fallback = null,
  render,
}: {
  salonId: string
  data: WorkspaceData
  fallback?: ReactNode
  render: () => ReactNode
}) {
  const currentStatus = normalizeStatus(data.salon.status)
  const canUseSetup = currentStatus === 'setup' && data.canManageSetup

  if (!canUseSetup && fallback) {
    return <>{fallback}</>
  }

  if (!canUseSetup && !data.canEnterOverride) {
    return <>{fallback}</>
  }

  if (data.canEnterOverride && !data.overrideMode && !canUseSetup) {
    return (
      <Alert variant="destructive">
        <ShieldAlert />
        <AlertTitle>ورود به Platform Owner Override</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <p>
            این حالت داده‌های عملیاتی سالن فعال را تغییر می‌دهد. هر تغییر به نام
            شما و با جزئیات درخواست ممیزی می‌شود. هیچ نشست مستاجر یا جانشینی
            کاربر سالن ساخته نمی‌شود.
          </p>
          <Button
            type="button"
            variant="destructive"
            onClick={() => data.setOverrideSalonId(salonId)}
          >
            <ShieldAlert data-icon="inline-start" />
            ورود آگاهانه به Override
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {data.overrideMode ? (
        <Alert variant="destructive">
          <ShieldAlert />
          <AlertTitle>Override فعال است</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <p>
              در حال ویرایش داده زنده سالن هستید. تغییرات با حساب شما در گزارش
              ممیزی ثبت می‌شود.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => data.setOverrideSalonId(null)}
            >
              خروج از Override
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {data.setupQuery.isLoading ? (
        <ScreenSkeleton label="در حال بارگذاری تنظیمات راه‌اندازی" />
      ) : null}
      {data.setupQuery.isError ? (
        <ErrorPanel
          message="بارگذاری تنظیمات راه‌اندازی ناموفق بود."
          onRetry={() => void data.setupQuery.refetch()}
        />
      ) : null}
      {data.setupQuery.data || data.overrideMode ? render() : null}
    </div>
  )
}

function WorkspaceNav({
  salonId,
  section,
  showHandoff,
}: {
  salonId: string
  section: SalonWorkspaceSection
  showHandoff: boolean
}) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="بخش‌های فضای کاری سالن">
      {WORKSPACE_NAV_ITEMS.filter((item) => showHandoff || item.section !== 'handoff').map(
        (item) => (
          <Button
            key={item.section}
            asChild
            size="sm"
            variant={section === item.section ? 'default' : 'outline'}
          >
            <Link to={item.to} params={{ salonId }}>
              <item.icon data-icon="inline-start" />
              {item.label}
            </Link>
          </Button>
        ),
      )}
    </nav>
  )
}

const WORKSPACE_LABELS: Record<SalonWorkspaceSection, string> = {
  overview: 'نمای کلی',
  edit: 'اطلاعات سالن',
  hours: 'ساعت کاری',
  presence: 'حضور سالن',
  staff: 'پرسنل',
  services: 'خدمات',
  clients: 'مشتریان',
  requests: 'درخواست‌ها',
  handoff: 'تحویل',
}

const WORKSPACE_STATUS_LABELS = {
  setup: 'راه‌اندازی',
  active: 'فعال',
  suspended: 'تعلیق‌شده',
  archived: 'آرشیوشده',
} as const

const WORKSPACE_NAV_ITEMS: Array<{
  section: SalonWorkspaceSection
  label: string
  to: string
  icon: LucideIcon
}> = [
  {
    section: 'overview',
    label: WORKSPACE_LABELS.overview,
    to: '/salons/$salonId',
    icon: LayoutDashboard,
  },
  {
    section: 'edit',
    label: WORKSPACE_LABELS.edit,
    to: '/salons/$salonId/edit',
    icon: Pencil,
  },
  {
    section: 'hours',
    label: WORKSPACE_LABELS.hours,
    to: '/salons/$salonId/hours',
    icon: Clock,
  },
  {
    section: 'presence',
    label: WORKSPACE_LABELS.presence,
    to: '/salons/$salonId/presence',
    icon: MapPin,
  },
  {
    section: 'staff',
    label: WORKSPACE_LABELS.staff,
    to: '/salons/$salonId/staff',
    icon: Users,
  },
  {
    section: 'services',
    label: WORKSPACE_LABELS.services,
    to: '/salons/$salonId/services',
    icon: Scissors,
  },
  {
    section: 'clients',
    label: WORKSPACE_LABELS.clients,
    to: '/salons/$salonId/clients',
    icon: UserRound,
  },
  {
    section: 'requests',
    label: WORKSPACE_LABELS.requests,
    to: '/salons/$salonId/requests',
    icon: Inbox,
  },
  {
    section: 'handoff',
    label: WORKSPACE_LABELS.handoff,
    to: '/salons/$salonId/handoff',
    icon: Handshake,
  },
]
