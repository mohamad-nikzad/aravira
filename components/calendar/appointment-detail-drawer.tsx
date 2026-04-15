'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldGroup, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Service,
  Client,
  AppointmentWithDetails,
  SERVICE_CATEGORIES,
  APPOINTMENT_STATUS,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { Phone, Clock, Calendar, User as UserIcon, Trash2 } from 'lucide-react'
import {
  APPOINTMENT_DURATION_BOUNDS,
  durationMinutesFromRange,
  endTimeFromDuration,
  validateAppointmentWindow,
} from '@/lib/appointment-time'
import { ClientPicker } from '@/components/calendar/client-picker'
import { JalaliDatePicker } from '@/components/ui/jalali-date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import { formatJalaliFullDate } from '@/lib/jalali'

function formatTomans(price: number) {
  return `${new Intl.NumberFormat('fa-IR').format(price)} تومان`
}

interface AppointmentDetailDrawerProps {
  appointment: AppointmentWithDetails | null
  onOpenChange: (open: boolean) => void
  staff: User[]
  services: Service[]
  clients: Client[]
  onSuccess: () => void
  onClientsChanged?: () => void
  readOnly?: boolean
}

export function AppointmentDetailDrawer({
  appointment,
  onOpenChange,
  staff,
  services,
  clients,
  onSuccess,
  onClientsChanged,
  readOnly = false,
}: AppointmentDetailDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [localClients, setLocalClients] = useState<Client[]>(clients)

  const [clientId, setClientId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [endTime, setEndTime] = useState('')
  const [status, setStatus] = useState<string>('')
  const [notes, setNotes] = useState('')

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
      setShowDeleteConfirm(false)
      setError('')
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
    setClientId(appointment.clientId)
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
  }

  const handleEditServiceChange = (id: string) => {
    setServiceId(id)
    const svc = services.find((s) => s.id === id)
    if (svc) applyDuration(svc.duration)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment) return
    setError('')

    const localCheck = validateAppointmentWindow(startTime, endTime)
    if (!localCheck.ok) {
      setError(localCheck.error)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          clientId,
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

      onSuccess()
    } catch {
      setError('خطایی رخ داد. لطفاً دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!appointment) return
    setLoading(true)

    try {
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

      onSuccess()
    } catch {
      setError('خطایی رخ داد. لطفاً دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!appointment) return
    setLoading(true)

    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'تغییر وضعیت انجام نشد')
        setLoading(false)
        return
      }

      onSuccess()
    } catch {
      setError('خطایی رخ داد. لطفاً دوباره تلاش کنید.')
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

  return (
    <Drawer open={!!appointment} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            {isEditing ? 'ویرایش نوبت' : appointment.client.name}
          </DrawerTitle>
          <DrawerDescription>
            {isEditing ? 'جزئیات نوبت را ویرایش کنید' : appointment.service.name}
          </DrawerDescription>
        </DrawerHeader>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4 overflow-auto px-4">
            <FieldGroup>
              <Field>
                <FieldLabel>مشتری</FieldLabel>
                <ClientPicker
                  clients={localClients}
                  value={clientId}
                  onChange={setClientId}
                  onClientCreated={handleClientCreated}
                />
              </Field>

              <Field>
                <FieldLabel>خدمت</FieldLabel>
                <Select value={serviceId} onValueChange={handleEditServiceChange} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب خدمت" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          {SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES]?.label || category}
                        </div>
                        {categoryServices.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} · پیشنهاد {service.duration} دقیقه — {formatTomans(service.price)}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>پرسنل</FieldLabel>
                <Select value={staffId} onValueChange={setStaffId} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب پرسنل" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

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
                  type="number"
                  min={APPOINTMENT_DURATION_BOUNDS.min}
                  max={APPOINTMENT_DURATION_BOUNDS.max}
                  step={5}
                  value={durationMinutes}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (!Number.isFinite(v)) return
                    applyDuration(v)
                  }}
                  dir="ltr"
                  className="text-left"
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
                  placeholder="یادداشت درباره این نوبت..."
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
                  {format(parseISO(`2000-01-01T${appointment.startTime}`), 'HH:mm')} —{' '}
                  {format(parseISO(`2000-01-01T${appointment.endTime}`), 'HH:mm')}
                  <span className="text-muted-foreground mr-1">
                    (
                    {new Intl.NumberFormat('fa-IR').format(
                      durationMinutesFromRange(appointment.startTime, appointment.endTime)
                    )}{' '}
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
                    {appointment.client.phone}
                  </a>
                </div>
              )}

              {appointment.notes && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="text-muted-foreground">{appointment.notes}</p>
                </div>
              )}
            </div>

            {!readOnly && appointment.status === 'scheduled' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('confirmed')}
                  disabled={loading}
                >
                  تایید نوبت
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={loading}
                >
                  لغو
                </Button>
              </div>
            )}

            {!readOnly && appointment.status === 'confirmed' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('completed')}
                  disabled={loading}
                >
                  انجام شد
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('no-show')}
                  disabled={loading}
                >
                  غیبت
                </Button>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DrawerFooter>
          {readOnly ? (
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                بستن
              </Button>
            </DrawerClose>
          ) : isEditing ? (
            <>
              <Button onClick={handleUpdate} disabled={loading}>
                {loading && <Spinner className="mr-2" />}
                {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
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
    </Drawer>
  )
}
