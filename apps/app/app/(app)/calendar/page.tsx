'use client'

import { Suspense, useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { format, parseISO, subDays, addDays } from 'date-fns'
import useSWR from 'swr'
import { Plus } from 'lucide-react'
import { CalendarHeader } from '@/components/calendar/calendar-header'
import { SalonFullCalendar } from '@/components/calendar/salon-full-calendar'
import { StaffFilter } from '@/components/calendar/staff-filter'
import { AppointmentDrawer } from '@/components/calendar/appointment-drawer'
import { AppointmentDetailDrawer } from '@/components/calendar/appointment-detail-drawer'
import {
  NetworkStatusBanner,
  OfflineStateCard,
} from '@/components/pwa/offline-state'
import {
  CalendarView,
  AppointmentWithDetails,
  User,
  Service,
  Client,
  WORKING_HOURS,
  type BusinessHours,
} from '@repo/salon-core/types'
import { useAuth } from '@/components/auth-provider'
import {
  fetchJsonOrThrow,
  useNetworkStatus,
  useOfflineSnapshot,
} from '@/lib/pwa-client'
import { CalendarSkeleton } from '@/components/skeletons/calendar-skeleton'
import { cn } from '@repo/ui/utils'

async function fetcher<T>(url: string) {
  return fetchJsonOrThrow<T>(url)
}

type AppointmentsResponse = {
  appointments: AppointmentWithDetails[]
}

type StaffResponse = {
  staff: User[]
}

type ServicesResponse = {
  services: Service[]
}

type ClientsResponse = {
  clients: Client[]
}

type BusinessResponse = {
  settings: BusinessHours | null
}

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'day', label: 'روز' },
  { value: 'week', label: 'هفته' },
  { value: 'month', label: 'ماه' },
  { value: 'list', label: 'لیست' },
]

function defaultRange(_view: CalendarView, anchor: Date): { start: string; end: string } {
  const start = subDays(anchor, 120)
  const end = addDays(anchor, 120)
  return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') }
}

function compareAppointments(a: AppointmentWithDetails, b: AppointmentWithDetails) {
  return `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)
}

function CalendarPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const isOnline = useNetworkStatus()
  const isManager = user?.role === 'manager'
  const [view, setView] = useState<CalendarView>('week')
  const [navDate, setNavDate] = useState(() => new Date())
  const [titleAnchor, setTitleAnchor] = useState(() => new Date())
  const [range, setRange] = useState<{ start: string; end: string } | null>(null)
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])

  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [createDate, setCreateDate] = useState<string>('')
  const [createTime, setCreateTime] = useState<string>('')
  const [initialClientIdForCreate, setInitialClientIdForCreate] = useState<string | undefined>(undefined)

  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null)

  const fallbackRange = useMemo(() => defaultRange(view, navDate), [view, navDate])
  const { start: startDate, end: endDate } = range ?? fallbackRange

  const {
    data: appointmentsData,
    error: appointmentsError,
    isLoading: appointmentsLoading,
    isValidating: appointmentsRefreshing,
    mutate: mutateAppointments,
  } = useSWR<AppointmentsResponse>(
    user ? `/api/appointments?startDate=${startDate}&endDate=${endDate}` : null,
    fetcher,
    { keepPreviousData: true }
  )
  const {
    data: staffData,
    mutate: mutateStaff,
  } = useSWR<StaffResponse>(user ? '/api/staff' : null, fetcher)
  const {
    data: servicesData,
    mutate: mutateServices,
  } = useSWR<ServicesResponse>(user ? '/api/services' : null, fetcher)
  const {
    data: clientsData,
    mutate: mutateClients,
  } = useSWR<ClientsResponse>(user && isManager ? '/api/clients' : null, fetcher)
  const {
    data: businessData,
    mutate: mutateBusiness,
  } = useSWR<BusinessResponse>(user ? '/api/settings/business' : null, fetcher)

  const appointmentsSnapshot = useOfflineSnapshot(
    user ? `appointments:${startDate}:${endDate}` : null,
    appointmentsData
  )
  const staffSnapshot = useOfflineSnapshot(user ? 'staff:list' : null, staffData)
  const servicesSnapshot = useOfflineSnapshot(
    user ? 'services:list' : null,
    servicesData
  )
  const clientsSnapshot = useOfflineSnapshot(
    user && isManager ? 'clients:list' : null,
    clientsData
  )
  const businessSnapshot = useOfflineSnapshot(
    user ? 'business:settings' : null,
    businessData
  )

  const appointmentsSource = appointmentsData ?? appointmentsSnapshot?.data
  const staffSource: StaffResponse | undefined = staffData ?? staffSnapshot?.data
  const servicesSource: ServicesResponse | undefined =
    servicesData ?? servicesSnapshot?.data
  const clientsSource: ClientsResponse | undefined =
    clientsData ?? clientsSnapshot?.data
  const businessSource: BusinessResponse | undefined =
    businessData ?? businessSnapshot?.data

  const appointments = useMemo<AppointmentWithDetails[]>(
    () => appointmentsSource?.appointments || [],
    [appointmentsSource]
  )
  const staff: User[] = staffSource?.staff || []
  const services: Service[] = servicesSource?.services || []
  const clients = useMemo<Client[]>(() => clientsSource?.clients ?? [], [clientsSource])

  const businessHours: BusinessHours = useMemo(() => {
    const s = businessSource?.settings
    if (s?.workingStart && s?.workingEnd && s?.slotDurationMinutes != null) {
      return {
        workingStart: s.workingStart,
        workingEnd: s.workingEnd,
        slotDurationMinutes: s.slotDurationMinutes,
      }
    }
    return {
      workingStart: WORKING_HOURS.start,
      workingEnd: WORKING_HOURS.end,
      slotDurationMinutes: WORKING_HOURS.slotDuration,
    }
  }, [businessSource])

  const filteredAppointments = useMemo(() => {
    if (!isManager || selectedStaffIds.length === 0) return appointments
    return appointments.filter((apt) => selectedStaffIds.includes(apt.staffId))
  }, [appointments, selectedStaffIds, isManager])

  const clientIdParam = searchParams.get('clientId')
  const appointmentIdParam = searchParams.get('appointmentId')
  const dateParam = searchParams.get('date')

  useEffect(() => {
    if (!dateParam) return
    const parsed = parseISO(dateParam)
    if (Number.isNaN(parsed.getTime())) return
    setNavDate(parsed)
    setTitleAnchor(parsed)
    setRange(null)
  }, [dateParam])

  useEffect(() => {
    if (!isManager || !clientIdParam || clients.length === 0) return
    if (!clients.some((c) => c.id === clientIdParam)) return
    setInitialClientIdForCreate(clientIdParam)
    setCreateDate(format(navDate, 'yyyy-MM-dd'))
    setCreateTime(businessHours.workingStart)
    setShowCreateDrawer(true)
    router.replace(pathname, { scroll: false })
  }, [clientIdParam, clients, isManager, navDate, businessHours.workingStart, router, pathname])

  useEffect(() => {
    if (!appointmentIdParam || appointments.length === 0) return

    const appointment = appointments.find((item) => item.id === appointmentIdParam)
    if (!appointment) return

    setSelectedAppointment(appointment)

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('appointmentId')
    const nextQuery = nextParams.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [appointmentIdParam, appointments, pathname, router, searchParams])

  const upsertAppointmentInCache = useCallback(
    (appointment: AppointmentWithDetails) => {
      const shouldKeep = appointment.date >= startDate && appointment.date <= endDate
      void mutateAppointments(
        (current) => {
          const base = current?.appointments ?? appointments
          const withoutAppointment = base.filter((apt) => apt.id !== appointment.id)
          const nextAppointments = shouldKeep
            ? [...withoutAppointment, appointment].sort(compareAppointments)
            : withoutAppointment

          return {
            ...(current ?? appointmentsData ?? { appointments: [] }),
            appointments: nextAppointments,
          }
        },
        { revalidate: false }
      )
    },
    [appointments, appointmentsData, endDate, mutateAppointments, startDate]
  )

  const removeAppointmentFromCache = useCallback(
    (id: string) => {
      void mutateAppointments(
        (current) => {
          const base = current?.appointments ?? appointments
          return {
            ...(current ?? appointmentsData ?? { appointments: [] }),
            appointments: base.filter((apt) => apt.id !== id),
          }
        },
        { revalidate: false }
      )
    },
    [appointments, appointmentsData, mutateAppointments]
  )

  const handleVisibleRangeChange = useCallback(
    (start: string, endInclusive: string, activeStart: Date) => {
      const paddedStart = format(subDays(parseISO(start), 14), 'yyyy-MM-dd')
      const paddedEnd = format(addDays(parseISO(endInclusive), 14), 'yyyy-MM-dd')
      setRange({ start: paddedStart, end: paddedEnd })
      setTitleAnchor(activeStart)
    },
    []
  )

  const handleStaffToggle = (id: string) => {
    setSelectedStaffIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id)
      }
      return [...prev, id]
    })
  }

  const handleToday = () => {
    const t = new Date()
    setNavDate(t)
    setTitleAnchor(t)
    setRange(null)
  }

  const handleAddAppointment = () => {
    if (!isManager || !isOnline) return
    setInitialClientIdForCreate(undefined)
    setCreateDate(format(navDate, 'yyyy-MM-dd'))
    setCreateTime(businessHours.workingStart)
    setShowCreateDrawer(true)
  }

  const handleSlotSelect = useCallback(
    (dateStr: string, timeStr: string) => {
      if (!isManager || !isOnline) return
      setInitialClientIdForCreate(undefined)
      setCreateDate(dateStr)
      setCreateTime(timeStr)
      setShowCreateDrawer(true)
    },
    [isManager, isOnline]
  )

  const handleAppointmentClick = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment)
  }

  const handleAppointmentCreated = (appointment: AppointmentWithDetails) => {
    upsertAppointmentInCache(appointment)
    setShowCreateDrawer(false)
    setInitialClientIdForCreate(undefined)
    void mutateAppointments()
  }

  const handleAppointmentChanged = (
    change:
      | { type: 'updated'; appointment: AppointmentWithDetails }
      | { type: 'deleted'; id: string }
  ) => {
    if (change.type === 'updated') {
      upsertAppointmentInCache(change.appointment)
    } else {
      removeAppointmentFromCache(change.id)
    }
    setSelectedAppointment(null)
    void mutateAppointments()
  }

  const handleCreateDrawerOpenChange = (open: boolean) => {
    setShowCreateDrawer(open)
    if (!open) setInitialClientIdForCreate(undefined)
  }

  const handleRetry = useCallback(() => {
    void mutateAppointments()
    void mutateStaff()
    void mutateServices()
    void mutateBusiness()
    if (isManager) {
      void mutateClients()
    }
  }, [
    isManager,
    mutateAppointments,
    mutateBusiness,
    mutateClients,
    mutateServices,
    mutateStaff,
  ])

  if (appointmentsLoading && !appointmentsSource) {
    return <CalendarSkeleton />
  }

  if (!user) return null

  if (!appointmentsSource) {
    return (
      <div className="flex h-full flex-col bg-background">
        <CalendarHeader
          titleAnchor={titleAnchor}
          navigationDate={navDate}
          view={view}
          onDateChange={setNavDate}
          onToday={handleToday}
        />
        <NetworkStatusBanner
          routeLabel="تقویم"
          isOnline={isOnline}
          hasSnapshot={Boolean(appointmentsSnapshot)}
          snapshotUpdatedAt={appointmentsSnapshot?.updatedAt}
          hasError={Boolean(appointmentsError)}
          onRetry={handleRetry}
        />
        <OfflineStateCard
          title="تقویم فعلا آماده نمایش نیست"
          description={
            isOnline
              ? 'بارگذاری تقویم کامل نشد. یک بار دیگر تلاش کنید.'
              : 'برای دیدن تقویم به اینترنت نیاز دارید، مگر این که قبلا همین بازه را باز کرده باشید.'
          }
          onAction={handleRetry}
        />
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col bg-background">
      <CalendarHeader
        titleAnchor={titleAnchor}
        navigationDate={navDate}
        view={view}
        onDateChange={setNavDate}
        onToday={handleToday}
      />

      <NetworkStatusBanner
        routeLabel="تقویم"
        isOnline={isOnline}
        hasSnapshot={Boolean(appointmentsSnapshot)}
        snapshotUpdatedAt={appointmentsSnapshot?.updatedAt}
        hasError={Boolean(appointmentsError)}
        onRetry={handleRetry}
      />

      <div className="flex items-center gap-2 border-b border-border/50 bg-card/80 px-3 py-1.5 sm:px-4">
        <div className="flex items-center rounded-lg bg-muted/70 p-0.5">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setView(opt.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all touch-manipulation',
                view === opt.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isManager && staff.length > 0 && (
          <div className="flex-1 overflow-hidden">
            <StaffFilter staff={staff} selectedIds={selectedStaffIds} onToggle={handleStaffToggle} />
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SalonFullCalendar
          className="flex-1"
          appointments={filteredAppointments}
          view={view}
          currentDate={navDate}
          businessHours={businessHours}
          readOnly={!isManager}
          onVisibleRangeChange={handleVisibleRangeChange}
          onSlotSelect={handleSlotSelect}
          onEventClick={handleAppointmentClick}
          isRefreshing={appointmentsRefreshing && !appointmentsLoading}
        />
      </div>

      {isManager && (
        <button
          onClick={handleAddAppointment}
          disabled={!isOnline}
          className={cn(
            'absolute bottom-5 left-4 z-40 flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.92] touch-manipulation',
            !isOnline && 'cursor-not-allowed opacity-55 saturate-50'
          )}
          aria-label="نوبت جدید"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}

      {isManager && (
        <AppointmentDrawer
          open={showCreateDrawer}
          onOpenChange={handleCreateDrawerOpenChange}
          initialDate={createDate}
          initialTime={createTime}
          initialClientId={initialClientIdForCreate}
          staff={staff}
          services={services}
          clients={clients}
          onSuccess={handleAppointmentCreated}
          onClientsChanged={() => mutateClients()}
        />
      )}

      <AppointmentDetailDrawer
        appointment={selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        staff={staff}
        services={services}
        clients={clients}
        readOnly={!isManager || !isOnline}
        onSuccess={handleAppointmentChanged}
        onClientsChanged={() => mutateClients()}
      />
    </div>
  )
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarPageContent />
    </Suspense>
  )
}
