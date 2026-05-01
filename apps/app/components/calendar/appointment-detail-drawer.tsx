'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
  DrawerNested,
} from '@repo/ui/drawer'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Input } from '@repo/ui/input'
import { Field, FieldLabel, FieldGroup, FieldError } from '@repo/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select'
import { Spinner } from '@repo/ui/spinner'
import { Badge } from '@repo/ui/badge'
import {
  User,
  Service,
  Client,
  AppointmentWithDetails,
  SERVICE_CATEGORIES,
  APPOINTMENT_STATUS,
} from '@repo/salon-core/types'
import {
  autoPickServiceForStaff,
  eligibleServicesForStaff,
  eligibleStaffForService,
} from '@repo/salon-core/staff-service-autofill'
import { cn } from '@repo/ui/utils'
import { Phone, Clock, Calendar, User as UserIcon, Trash2 } from 'lucide-react'
import {
  APPOINTMENT_DURATION_BOUNDS,
  durationMinutesFromRange,
  endTimeFromDuration,
  validateAppointmentWindow,
} from '@repo/salon-core/appointment-time'
import { ClientPicker } from '@/components/calendar/client-picker'
import { useManagerDataClient } from '@/components/manager-data-client-provider'
import { DataClientHttpError } from '@repo/data-client'
import { useNetworkStatus } from '@/lib/pwa-client'
import { JalaliDatePicker } from '@repo/ui/jalali-date-picker'
import { TimePicker } from '@repo/ui/time-picker'
import { formatJalaliFullDate } from '@repo/salon-core/jalali'
import { displayPhone, normalizePhone } from '@repo/salon-core/phone'
import { formatPersianTime, parseLocalizedInt, toPersianDigits } from '@repo/salon-core/persian-digits'

type StatusActionState = {
  status: AppointmentWithDetails['status']
  mode: 'saving' | 'saved' | 'queued'
  message: string
} | null

function formatTomans(price: number) {
  return `${new Intl.NumberFormat('fa-IR').format(price)} تومان`
}

interface AppointmentDetailDrawerProps {
  appointment: AppointmentWithDetails | null
  onOpenChange: (open: boolean) => void
  staff: User[]
  services: Service[]
  clients: Client[]
  onSuccess: (change: AppointmentDetailChange) => void
  onClientsChanged?: () => void
  readOnly?: boolean
  canChangeStatus?: boolean
}

type AppointmentDetailChange =
  | { type: 'updated'; appointment: AppointmentWithDetails }
  | { type: 'deleted'; id: string }

export function AppointmentDetailDrawer({
  appointment,
  onOpenChange,
  staff,
  services,
  clients,
  onSuccess,
  onClientsChanged,
  readOnly = false,
  canChangeStatus = !readOnly,
}: AppointmentDetailDrawerProps) {
  const dataClient = useManagerDataClient()
  const isOnline = useNetworkStatus()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusAction, setStatusAction] = useState<StatusActionState>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCompleteClientDrawer, setShowCompleteClientDrawer] = useState(false)
  const [completeClientName, setCompleteClientName] = useState('')
  const [completeClientPhone, setCompleteClientPhone] = useState('')
  const [completeClientNotes, setCompleteClientNotes] = useState('')
  const [completeClientError, setCompleteClientError] = useState('')
  const [completeClientLoading, setCompleteClientLoading] = useState(false)
  const [duplicateClient, setDuplicateClient] = useState<Client | null>(null)
  const [localClients, setLocalClients] = useState<Client[]>(clients)
  const completeClientNameRef = useRef<HTMLInputElement>(null)
  const temporaryClientNameRef = useRef<HTMLInputElement>(null)

  const [clientId, setClientId] = useState('')
  const [useTemporaryClient, setUseTemporaryClient] = useState(false)
  const [temporaryClientName, setTemporaryClientName] = useState('')
  const [temporaryClientNotes, setTemporaryClientNotes] = useState('')
  const [staffId, setStaffId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [endTime, setEndTime] = useState('')
  const [status, setStatus] = useState<string>('')
  const [notes, setNotes] = useState('')

  const staffRoleOnly = useMemo(
    () => staff.filter((m) => m.role === 'staff'),
    [staff]
  )

  useEffect(() => {
    setLocalClients(clients)
  }, [clients])

  useEffect(() => {
    setIsEditing(false)
    setEditingAppointmentId(null)
    setShowDeleteConfirm(false)
    setShowCompleteClientDrawer(false)
    setUseTemporaryClient(false)
    setTemporaryClientName('')
    setTemporaryClientNotes('')
    setCompleteClientName('')
    setCompleteClientPhone('')
    setCompleteClientNotes('')
    setCompleteClientError('')
    setCompleteClientLoading(false)
    setDuplicateClient(null)
    setError('')
    setStatusAction(null)
  }, [appointment?.id])

  const applyDuration = (mins: number) => {
    const clamped = Math.min(
      APPOINTMENT_DURATION_BOUNDS.max,
      Math.max(APPOINTMENT_DURATION_BOUNDS.min, mins)
    )
    setDurationMinutes(clamped)
    setEndTime(endTimeFromDuration(startTime, clamped))
  }

  const applyEndTime = (et: string) => {
    setEndTime(et)
    try {
      const d = durationMinutesFromRange(startTime, et)
      if (d > 0) setDurationMinutes(d)
    } catch {
      /* ignore */
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setIsEditing(false)
      setEditingAppointmentId(null)
      setShowDeleteConfirm(false)
      setShowCompleteClientDrawer(false)
      setUseTemporaryClient(false)
      setTemporaryClientName('')
      setTemporaryClientNotes('')
      setCompleteClientName('')
      setCompleteClientPhone('')
      setCompleteClientNotes('')
      setCompleteClientError('')
      setCompleteClientLoading(false)
      setDuplicateClient(null)
      setError('')
      setStatusAction(null)
    } else {
      setLocalClients(clients)
    }
    onOpenChange(isOpen)
  }

  const handleClientCreated = (newClient: Client) => {
    setLocalClients((prev) => [newClient, ...prev])
    onClientsChanged?.()
  }

  const startEditing = () => {
    if (!appointment || readOnly) return
    setLocalClients(
      appointment.client.isPlaceholder && !clients.some((client) => client.id === appointment.client.id)
        ? [appointment.client, ...clients]
        : clients
    )
    setUseTemporaryClient(appointment.client.isPlaceholder)
    setTemporaryClientName(appointment.client.isPlaceholder ? appointment.client.name : '')
    setTemporaryClientNotes(appointment.client.isPlaceholder ? appointment.client.notes ?? '' : '')
    setClientId(appointment.client.isPlaceholder ? '' : appointment.clientId)
    setStaffId(appointment.staffId)
    setServiceId(appointment.serviceId)
    setDate(appointment.date)
    setStartTime(appointment.startTime)
    setEndTime(appointment.endTime)
    setDurationMinutes(
      durationMinutesFromRange(appointment.startTime, appointment.endTime)
    )
    setStatus(appointment.status)
    setNotes(appointment.notes || '')
    setIsEditing(true)
    setEditingAppointmentId(appointment.id)
  }

  useEffect(() => {
    if (showCompleteClientDrawer) {
      requestAnimationFrame(() => completeClientNameRef.current?.focus())
    }
  }, [showCompleteClientDrawer])

  useEffect(() => {
    if (isEditing && useTemporaryClient) {
      requestAnimationFrame(() => temporaryClientNameRef.current?.focus())
    }
  }, [isEditing, useTemporaryClient])

  const openCompleteClientDrawer = () => {
    if (!appointment?.client.isPlaceholder) return
    setCompleteClientName(appointment.client.name)
    setCompleteClientPhone('')
    setCompleteClientNotes(appointment.client.notes ?? '')
    setCompleteClientError('')
    setDuplicateClient(null)
    setShowCompleteClientDrawer(true)
  }

  const submitCompleteClient = async (reassignToExistingClientId?: string) => {
    if (!appointment) return

    setCompleteClientLoading(true)
    setCompleteClientError('')

    try {
      let updated: AppointmentWithDetails
      if (dataClient) {
        updated = await dataClient.appointments.completePlaceholderClient(appointment.id, {
          name: completeClientName.trim(),
          phone: completeClientPhone.trim(),
          notes: completeClientNotes.trim() || undefined,
          reassignToExistingClientId,
        })
        void dataClient.sync.processPending()
      } else {
        const res = await fetch(`/api/appointments/${appointment.id}/complete-client`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: completeClientName.trim(),
            phone: completeClientPhone.trim(),
            notes: completeClientNotes.trim() || undefined,
            reassignToExistingClientId,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          setCompleteClientError(data.error || 'تکمیل اطلاعات مشتری انجام نشد')
          setDuplicateClient(data.existingClient ?? null)
          return
        }
        updated = data.appointment as AppointmentWithDetails
      }

      setShowCompleteClientDrawer(false)
      setDuplicateClient(null)
      onClientsChanged?.()
      onSuccess({ type: 'updated', appointment: updated })
    } catch (err) {
      if (err instanceof DataClientHttpError) {
        setCompleteClientError(err.message)
        const body = err.body as { existingClient?: Client } | null
        setDuplicateClient(body?.existingClient ?? null)
      } else {
        setCompleteClientError('خطایی رخ داد. لطفاً دوباره تلاش کنید.')
      }
    } finally {
      setCompleteClientLoading(false)
    }
  }

  const handleEditServiceChange = (id: string) => {
    setServiceId(id)
    const svc = services.find((s) => s.id === id)
    if (svc) applyDuration(svc.duration)

    const eligibleAll = eligibleStaffForService(staff, id)
    const eligibleStaffMembers = eligibleStaffForService(staffRoleOnly, id)
    if (eligibleStaffMembers.length === 1) {
      setStaffId(eligibleStaffMembers[0].id)
    } else if (!eligibleAll.some((m) => m.id === staffId)) {
      setStaffId('')
    }
  }

  const handleEditStaffChange = (id: string) => {
    setStaffId(id)
    const member = staffRoleOnly.find((s) => s.id === id)
    if (!member) return

    const eligible = eligibleServicesForStaff(member, services)
    const current = services.find((s) => s.id === serviceId)
    const serviceStillOk =
      !!current && eligible.some((s) => s.id === serviceId)

    if (!serviceStillOk) {
      const explicitList =
        member.serviceIds != null && member.serviceIds.length > 0
      const auto = autoPickServiceForStaff(eligible, {
        staffHasExplicitServiceList: explicitList,
      })
      if (auto) {
        setServiceId(auto.id)
        applyDuration(auto.duration)
      } else {
        setServiceId('')
      }
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment) return
    setError('')
    if (useTemporaryClient && !temporaryClientName.trim()) {
      setError('نام مشتری موقت الزامی است')
      return
    }
    if (!useTemporaryClient && !clientId) {
      setError('انتخاب مشتری الزامی است')
      return
    }

    const localCheck = validateAppointmentWindow(startTime, endTime)
    if (!localCheck.ok) {
      setError(localCheck.error)
      return
    }

    setLoading(true)
    try {
      if (dataClient) {
        const result = await dataClient.appointments.update(appointment.id, {
          ...(useTemporaryClient
            ? {
                placeholderClient: {
                  name: temporaryClientName.trim(),
                  notes: temporaryClientNotes.trim() || undefined,
                },
              }
            : { clientId }),
          staffId,
          serviceId,
          date,
          startTime,
          endTime,
          durationMinutes,
          status: status as AppointmentWithDetails['status'],
          notes: notes || undefined,
        })
        void dataClient.sync.processPending()
        onSuccess(
          result.type === 'deleted'
            ? { type: 'deleted', id: result.id }
            : { type: 'updated', appointment: result.appointment }
        )
        return
      }

      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...(useTemporaryClient
            ? {
                placeholderClient: {
                  name: temporaryClientName.trim(),
                  notes: temporaryClientNotes.trim() || undefined,
                },
              }
            : { clientId }),
          staffId,
          serviceId,
          date,
          startTime,
          endTime,
          durationMinutes,
          status,
          notes: notes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'به‌روزرسانی نوبت انجام نشد')
        setLoading(false)
        return
      }

      if (typeof data.removedAppointmentId === 'string') {
        onSuccess({ type: 'deleted', id: data.removedAppointmentId })
        return
      }

      if (!data.appointment) {
        setError('پاسخ به‌روزرسانی کامل نبود')
        setLoading(false)
        return
      }

      onSuccess({ type: 'updated', appointment: data.appointment })
    } catch (err) {
      setError(
        err instanceof DataClientHttpError
          ? err.message
          : 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!appointment) return
    setError('')
    setLoading(true)

    try {
      if (dataClient) {
        await dataClient.appointments.remove(appointment.id)
        void dataClient.sync.processPending()
        onSuccess({ type: 'deleted', id: appointment.id })
        return
      }

      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'حذف نوبت انجام نشد')
        setLoading(false)
        return
      }

      onSuccess({ type: 'deleted', id: appointment.id })
    } catch (err) {
      setError(
        err instanceof DataClientHttpError
          ? err.message
          : 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!appointment) return
    setError('')
    const nextStatus = newStatus as AppointmentWithDetails['status']
    setStatusAction({
      status: nextStatus,
      mode: 'saving',
      message: 'در حال ثبت وضعیت...',
    })
    setLoading(true)

    try {
      if (dataClient) {
        const result = await dataClient.appointments.updateStatus(
          appointment.id,
          nextStatus
        )
        void dataClient.sync.processPending()
        setStatusAction({
          status: nextStatus,
          mode: isOnline ? 'saved' : 'queued',
          message:
            result.type === 'deleted'
              ? isOnline
                ? 'رزرو موقت لغو و حذف شد.'
                : 'لغو رزرو موقت آفلاین ثبت شد و بعدا همگام می‌شود.'
              : isOnline
                ? 'وضعیت نوبت ثبت شد.'
                : 'وضعیت نوبت آفلاین ثبت شد و بعدا همگام می‌شود.',
        })
        onSuccess(
          result.type === 'deleted'
            ? { type: 'deleted', id: result.id }
            : { type: 'updated', appointment: result.appointment }
        )
        return
      }

      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'تغییر وضعیت انجام نشد')
        setStatusAction(null)
        setLoading(false)
        return
      }

      if (typeof data.removedAppointmentId === 'string') {
        setStatusAction({
          status: nextStatus,
          mode: 'saved',
          message: 'رزرو موقت لغو و حذف شد.',
        })
        onSuccess({ type: 'deleted', id: data.removedAppointmentId })
        return
      }

      if (!data.appointment) {
        setError('پاسخ تغییر وضعیت کامل نبود')
        setStatusAction(null)
        setLoading(false)
        return
      }

      setStatusAction({
        status: nextStatus,
        mode: 'saved',
        message: 'وضعیت نوبت ثبت شد.',
      })
      onSuccess({ type: 'updated', appointment: data.appointment })
    } catch (err) {
      setError(
        err instanceof DataClientHttpError
          ? err.message
          : 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'
      )
      setStatusAction(null)
    } finally {
      setLoading(false)
    }
  }

  const servicesByCategory = services.reduce(
    (acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = []
      }
      acc[service.category].push(service)
      return acc
    },
    {} as Record<string, Service[]>
  )

  if (!appointment) return null

  const statusInfo = APPOINTMENT_STATUS[appointment.status]
  const isEditingCurrentAppointment = isEditing && editingAppointmentId === appointment.id

  return (
    <Drawer open={!!appointment} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            {isEditingCurrentAppointment ? 'ویرایش نوبت' : appointment.client.name}
          </DrawerTitle>
          <DrawerDescription>
            {isEditingCurrentAppointment
              ? 'جزئیات نوبت را ویرایش کنید. نوبت‌های هم‌زمان فقط با پرسنل و مشتری متفاوت نسبت به نوبت‌های هم‌پوشان مجاز است.'
              : appointment.service.name}
          </DrawerDescription>
        </DrawerHeader>

        {isEditingCurrentAppointment ? (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4 overflow-auto px-4">
            <FieldGroup>
              <Field>
                <FieldLabel>مشتری</FieldLabel>
                <div className="space-y-3">
                  <label
                    htmlFor="edit-temporary-client-mode"
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-card px-3 py-3"
                  >
                    <Checkbox
                      id="edit-temporary-client-mode"
                      checked={useTemporaryClient}
                      onCheckedChange={(checked) => {
                        const enabled = checked === true
                        setUseTemporaryClient(enabled)
                        setError('')
                        if (enabled) {
                          setClientId('')
                          setTemporaryClientName(appointment.client.isPlaceholder ? appointment.client.name : '')
                          setTemporaryClientNotes(appointment.client.isPlaceholder ? appointment.client.notes ?? '' : '')
                          return
                        }
                        setTemporaryClientName('')
                        setTemporaryClientNotes('')
                      }}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">بعداً اطلاعات مشتری را کامل می‌کنم</p>
                      <p className="text-xs text-muted-foreground">
                        در حالت موقت فقط یک نام نمایشی نگه می‌داریم و شماره تماس بعداً تکمیل می‌شود.
                      </p>
                    </div>
                  </label>

                  {useTemporaryClient ? (
                    <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                      <Field className="gap-2">
                        <FieldLabel htmlFor="edit-temporary-client-name">نام مشتری</FieldLabel>
                        <Input
                          id="edit-temporary-client-name"
                          ref={temporaryClientNameRef}
                          value={temporaryClientName}
                          onChange={(e) => setTemporaryClientName(e.target.value)}
                          placeholder="مثلاً دوستِ سارا"
                          required
                        />
                      </Field>

                      <Field className="gap-2">
                        <FieldLabel htmlFor="edit-temporary-client-notes">یادداشت (اختیاری)</FieldLabel>
                        <Input
                          id="edit-temporary-client-notes"
                          value={temporaryClientNotes}
                          onChange={(e) => setTemporaryClientNotes(e.target.value)}
                          placeholder="مثلاً شماره را بعداً می‌گیرم"
                        />
                      </Field>
                    </div>
                  ) : (
                    <ClientPicker
                      clients={localClients}
                      value={clientId}
                      onChange={setClientId}
                      onClientCreated={handleClientCreated}
                    />
                  )}
                </div>
              </Field>

              <div className="flex min-w-0 flex-col gap-7">
                <Field>
                  <FieldLabel>پرسنل</FieldLabel>
                  <Select
                    value={staffId || undefined}
                    onValueChange={handleEditStaffChange}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب پرسنل" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffRoleOnly.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>خدمت</FieldLabel>
                  <Select
                    value={serviceId || undefined}
                    onValueChange={handleEditServiceChange}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب خدمت" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                        <div key={category}>
                          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                              {SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES]?.label ||
                              category}
                          </div>
                          {categoryServices.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} · پیشنهاد {toPersianDigits(service.duration)} دقیقه —{' '}
                              {formatTomans(service.price)}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="edit-date">تاریخ</FieldLabel>
                  <JalaliDatePicker
                    id="edit-date"
                    value={date}
                    onChange={setDate}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-time">شروع</FieldLabel>
                  <TimePicker
                    id="edit-time"
                    value={startTime}
                    onChange={(st) => {
                      setStartTime(st)
                      setEndTime(endTimeFromDuration(st, durationMinutes))
                    }}
                    label="ساعت شروع"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="edit-duration">مدت (دقیقه)</FieldLabel>
                <Input
                  id="edit-duration"
                  type="text"
                  inputMode="numeric"
                  value={toPersianDigits(durationMinutes)}
                  onChange={(e) => {
                    const v = parseLocalizedInt(e.target.value, durationMinutes)
                    if (!Number.isFinite(v)) return
                    applyDuration(v)
                  }}
                  dir="rtl"
                  className="text-right tabular-nums"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-end">پایان</FieldLabel>
                <TimePicker
                  id="edit-end"
                  value={endTime}
                  onChange={applyEndTime}
                  label="ساعت پایان"
                />
              </Field>

              <Field>
                <FieldLabel>وضعیت</FieldLabel>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(APPOINTMENT_STATUS).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-notes">توضیحات (اختیاری)</FieldLabel>
                <Input
                  id="edit-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="یادداشت درباره این نوبت…"
                />
              </Field>

              {error && <FieldError>{error}</FieldError>}
            </FieldGroup>
          </form>
        ) : (
          <div className="flex flex-col gap-4 overflow-auto px-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn('text-xs', statusInfo.color)}>
                {statusInfo.label}
              </Badge>
              {appointment.client.isPlaceholder ? (
                <Badge variant="outline" className="text-xs border-amber-300 bg-amber-50 text-amber-800">
                  اطلاعات ناقص
                </Badge>
              ) : null}
              <span className="text-sm text-muted-foreground">{formatTomans(appointment.service.price)}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{formatJalaliFullDate(appointment.date)}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span dir="ltr" className="text-right">
                  {formatPersianTime(format(parseISO(`2000-01-01T${appointment.startTime}`), 'HH:mm'))} —{' '}
                  {formatPersianTime(format(parseISO(`2000-01-01T${appointment.endTime}`), 'HH:mm'))}
                  <span className="text-muted-foreground mr-1">
                    (
                    {toPersianDigits(durationMinutesFromRange(appointment.startTime, appointment.endTime))}{' '}
                    دقیقه)
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>با {appointment.staff.name}</span>
              </div>

              {appointment.client.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <a href={`tel:${appointment.client.phone}`} className="text-primary hover:underline">
                    {displayPhone(appointment.client.phone)}
                  </a>
                </div>
              )}

              {appointment.notes && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="text-muted-foreground">{appointment.notes}</p>
                </div>
              )}
            </div>

            {canChangeStatus && appointment.status === 'scheduled' && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-10 touch-manipulation"
                  onClick={() => handleStatusChange('confirmed')}
                  disabled={loading}
                >
                  {statusAction?.mode === 'saving' && statusAction.status === 'confirmed' && (
                    <Spinner className="ml-2 size-3.5" />
                  )}
                  تایید نوبت
                </Button>
                {!readOnly && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-10 touch-manipulation"
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={loading}
                  >
                    {statusAction?.mode === 'saving' && statusAction.status === 'cancelled' && (
                      <Spinner className="ml-2 size-3.5" />
                    )}
                    لغو
                  </Button>
                )}
              </div>
            )}

            {canChangeStatus && appointment.status === 'confirmed' && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-10 touch-manipulation"
                  onClick={() => handleStatusChange('completed')}
                  disabled={loading}
                >
                  {statusAction?.mode === 'saving' && statusAction.status === 'completed' && (
                    <Spinner className="ml-2 size-3.5" />
                  )}
                  انجام شد
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-10 touch-manipulation"
                  onClick={() => handleStatusChange('no-show')}
                  disabled={loading}
                >
                  {statusAction?.mode === 'saving' && statusAction.status === 'no-show' && (
                    <Spinner className="ml-2 size-3.5" />
                  )}
                  غیبت
                </Button>
              </div>
            )}

            {statusAction && statusAction.mode !== 'saving' && (
              <p
                className={cn(
                  'rounded-xl border px-3 py-2 text-xs',
                  statusAction.mode === 'queued'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-100'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100'
                )}
              >
                {statusAction.message}
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {appointment.client.isPlaceholder && !readOnly ? (
              <div className="rounded-2xl border border-amber-300/70 bg-amber-50/80 p-3 text-sm text-amber-950">
                <p className="font-medium">اطلاعات این مشتری هنوز کامل نشده است.</p>
                <p className="mt-1 text-xs text-amber-800">
                  شماره تماس و مشخصات نهایی را ثبت کنید تا این نوبت مثل یک مشتری عادی ادامه پیدا کند.
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  variant="outline"
                  onClick={openCompleteClientDrawer}
                >
                  تکمیل اطلاعات مشتری
                </Button>
              </div>
            ) : null}
          </div>
        )}

        <DrawerFooter>
          {readOnly ? (
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                بستن
              </Button>
            </DrawerClose>
          ) : isEditingCurrentAppointment ? (
            <>
              <Button
                onClick={handleUpdate}
                disabled={
                  loading ||
                  (useTemporaryClient ? !temporaryClientName.trim() : !clientId)
                }
              >
                {loading && <Spinner className="mr-2" />}
                {loading ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setEditingAppointmentId(null)
                }}
              >
                انصراف
              </Button>
            </>
          ) : showDeleteConfirm ? (
            <>
              <p className="text-sm text-center text-muted-foreground mb-2">
                آیا از حذف این نوبت مطمئن هستید؟
              </p>
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                {loading && <Spinner className="mr-2" />}
                بله، حذف شود
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                انصراف
              </Button>
            </>
          ) : (
            <>
              <Button onClick={startEditing} className="touch-manipulation">
                ویرایش نوبت
              </Button>
              <div className="flex gap-2">
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1">
                    بستن
                  </Button>
                </DrawerClose>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>

      <DrawerNested open={showCompleteClientDrawer} onOpenChange={setShowCompleteClientDrawer}>
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[92lvh]">
          <DrawerHeader>
            <DrawerTitle>تکمیل اطلاعات مشتری</DrawerTitle>
            <DrawerDescription>
              نام و شماره تماس را ثبت کنید تا این نوبت از حالت موقت خارج شود.
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="complete-client-name">نام مشتری</FieldLabel>
                <Input
                  id="complete-client-name"
                  ref={completeClientNameRef}
                  value={completeClientName}
                  onChange={(e) => setCompleteClientName(e.target.value)}
                  placeholder="نام کامل مشتری"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="complete-client-phone">شماره تماس</FieldLabel>
                <Input
                  id="complete-client-phone"
                  type="tel"
                  value={displayPhone(completeClientPhone, '')}
                  onChange={(e) => setCompleteClientPhone(normalizePhone(e.target.value))}
                  placeholder="۰۹۱۲…"
                  dir="ltr"
                  className="text-left tabular-nums"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="complete-client-notes">یادداشت (اختیاری)</FieldLabel>
                <Input
                  id="complete-client-notes"
                  value={completeClientNotes}
                  onChange={(e) => setCompleteClientNotes(e.target.value)}
                  placeholder="یادداشت مشتری"
                />
              </Field>

              {duplicateClient ? (
                <div className="rounded-xl border border-amber-300/70 bg-amber-50 p-3 text-sm">
                  <p className="font-medium text-amber-950">
                    این شماره قبلاً برای {duplicateClient.name} ثبت شده است.
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    می‌توانید این نوبت را به همان مشتری موجود وصل کنید تا سابقه‌ها یکی بماند.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => void submitCompleteClient(duplicateClient.id)}
                    disabled={completeClientLoading}
                  >
                    اتصال به مشتری موجود
                  </Button>
                </div>
              ) : null}

              {completeClientError ? <FieldError>{completeClientError}</FieldError> : null}
            </FieldGroup>
          </div>

          <DrawerFooter>
            <Button
              onClick={() => void submitCompleteClient()}
              disabled={
                completeClientLoading ||
                !completeClientName.trim() ||
                !completeClientPhone.trim()
              }
            >
              {completeClientLoading ? 'در حال ذخیره…' : 'ثبت اطلاعات'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">بستن</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </DrawerNested>
    </Drawer>
  )
}
