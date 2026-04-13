'use client'

import { useState, useMemo, useCallback } from 'react'
import { format, parseISO, subDays, addDays } from 'date-fns'
import useSWR from 'swr'
import { CalendarHeader } from '@/components/calendar/calendar-header'
import { SalonFullCalendar } from '@/components/calendar/salon-full-calendar'
import { StaffFilter } from '@/components/calendar/staff-filter'
import { AppointmentDrawer } from '@/components/calendar/appointment-drawer'
import { AppointmentDetailDrawer } from '@/components/calendar/appointment-detail-drawer'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarView, AppointmentWithDetails, User, Service, Client } from '@/lib/types'
import { useAuth } from '@/components/auth-provider'
import { Spinner } from '@/components/ui/spinner'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

/** Wide initial window so events load before/after `datesSet`; API uses Gregorian yyyy-MM-dd */
function defaultRange(_view: CalendarView, anchor: Date): { start: string; end: string } {
  const start = subDays(anchor, 120)
  const end = addDays(anchor, 120)
  return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') }
}

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth()
  const [view, setView] = useState<CalendarView>('week')
  const [navDate, setNavDate] = useState(() => new Date())
  const [titleAnchor, setTitleAnchor] = useState(() => new Date())
  const [range, setRange] = useState<{ start: string; end: string } | null>(null)
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])

  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [createDate, setCreateDate] = useState<string>('')
  const [createTime, setCreateTime] = useState<string>('')

  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null)

  const fallbackRange = useMemo(() => defaultRange(view, navDate), [view, navDate])
  const { start: startDate, end: endDate } = range ?? fallbackRange

  const { data: appointmentsData, mutate: mutateAppointments } = useSWR(
    user ? `/api/appointments?startDate=${startDate}&endDate=${endDate}` : null,
    fetcher
  )
  const { data: staffData } = useSWR(user ? '/api/staff' : null, fetcher)
  const { data: servicesData } = useSWR(user ? '/api/services' : null, fetcher)
  const { data: clientsData } = useSWR(user ? '/api/clients' : null, fetcher)

  const appointments: AppointmentWithDetails[] = appointmentsData?.appointments || []
  const staff: User[] = staffData?.staff || []
  const services: Service[] = servicesData?.services || []
  const clients: Client[] = clientsData?.clients || []

  const filteredAppointments = useMemo(() => {
    if (selectedStaffIds.length === 0) return appointments
    return appointments.filter((apt) => selectedStaffIds.includes(apt.staffId))
  }, [appointments, selectedStaffIds])

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
    setCreateDate(format(navDate, 'yyyy-MM-dd'))
    setCreateTime('09:00')
    setShowCreateDrawer(true)
  }

  const handleSlotSelect = useCallback((dateStr: string, timeStr: string) => {
    setCreateDate(dateStr)
    setCreateTime(timeStr)
    setShowCreateDrawer(true)
  }, [])

  const handleAppointmentClick = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment)
  }

  const handleAppointmentCreated = () => {
    setShowCreateDrawer(false)
    mutateAppointments()
  }

  const handleAppointmentUpdated = () => {
    setSelectedAppointment(null)
    mutateAppointments()
  }

  if (authLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-dvh flex-col bg-background">
      <CalendarHeader
        titleAnchor={titleAnchor}
        navigationDate={navDate}
        view={view}
        onDateChange={setNavDate}
        onToday={handleToday}
        onAddAppointment={handleAddAppointment}
      />

      <div className="flex flex-col border-b bg-card sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)} className="px-4 py-2">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="day">روز</TabsTrigger>
            <TabsTrigger value="week">هفته</TabsTrigger>
            <TabsTrigger value="month">ماه</TabsTrigger>
            <TabsTrigger value="list">برنامه</TabsTrigger>
          </TabsList>
        </Tabs>
        <StaffFilter
          staff={staff}
          selectedIds={selectedStaffIds}
          onToggle={handleStaffToggle}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-1 sm:p-2">
        <SalonFullCalendar
          className="rounded-xl border border-border bg-card shadow-sm"
          appointments={filteredAppointments}
          view={view}
          currentDate={navDate}
          onVisibleRangeChange={handleVisibleRangeChange}
          onSlotSelect={handleSlotSelect}
          onEventClick={handleAppointmentClick}
        />
      </div>

      <AppointmentDrawer
        open={showCreateDrawer}
        onOpenChange={setShowCreateDrawer}
        initialDate={createDate}
        initialTime={createTime}
        staff={staff}
        services={services}
        clients={clients}
        onSuccess={handleAppointmentCreated}
      />

      <AppointmentDetailDrawer
        appointment={selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        staff={staff}
        services={services}
        clients={clients}
        onSuccess={handleAppointmentUpdated}
      />
    </div>
  )
}
