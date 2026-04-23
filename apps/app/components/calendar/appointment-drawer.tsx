'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@repo/ui/drawer'
import { Button } from '@repo/ui/button'
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
import { User, Service, Client, AppointmentWithDetails } from '@repo/salon-core/types'
import {
  autoPickServiceForStaff,
  eligibleServicesForStaff,
  eligibleStaffForService,
} from '@repo/salon-core/staff-service-autofill'
import {
  APPOINTMENT_DURATION_BOUNDS,
  durationMinutesFromRange,
  endTimeFromDuration,
  formatTimeHm,
  parseTimeHm,
  validateAppointmentWindow,
} from '@repo/salon-core/appointment-time'
import { ClientPicker } from '@/components/calendar/client-picker'
import { JalaliDatePicker } from '@repo/ui/jalali-date-picker'
import { TimePicker } from '@repo/ui/time-picker'
import { parseLocalizedInt, toPersianDigits } from '@repo/salon-core/persian-digits'

const CATEGORY_LABELS: Record<string, string> = {
  hair: 'مو',
  nails: 'ناخن',
  skincare: 'پوست',
  spa: 'اسپا',
}

const DURATION_PRESETS = [30, 45, 60, 90, 120]

interface AppointmentDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate: string
  initialTime: string
  /** When set while opening, pre-selects this client (e.g. deep link from client profile). */
  initialClientId?: string
  staff: User[]
  services: Service[]
  clients: Client[]
  onSuccess: (appointment: AppointmentWithDetails) => void
  onClientsChanged?: () => void
}

export function AppointmentDrawer({
  open,
  onOpenChange,
  initialDate,
  initialTime,
  initialClientId,
  staff,
  services,
  clients,
  onSuccess,
  onClientsChanged,
}: AppointmentDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [clientId, setClientId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState(initialDate)
  const [startTime, setStartTime] = useState(() => formatTimeHm(parseTimeHm(initialTime)))
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [endTime, setEndTime] = useState(() =>
    endTimeFromDuration(formatTimeHm(parseTimeHm(initialTime)), 45)
  )
  const [notes, setNotes] = useState('')
  const [localClients, setLocalClients] = useState<Client[]>(clients)
  const [staffSlotOk, setStaffSlotOk] = useState<Record<string, boolean>>({})
  const durationRef = useRef(durationMinutes)
  durationRef.current = durationMinutes

  useEffect(() => {
    setLocalClients(clients)
  }, [clients])

  const resetFormForInitialSlot = useCallback(() => {
    const defaultDuration = 45
    const st = formatTimeHm(parseTimeHm(initialTime))

    durationRef.current = defaultDuration
    setDurationMinutes(defaultDuration)
    setDate(initialDate)
    setStartTime(st)
    setEndTime(endTimeFromDuration(st, defaultDuration))
    setClientId(initialClientId ?? '')
    setStaffId('')
    setServiceId('')
    setNotes('')
    setError('')
    setLocalClients(clients)
  }, [clients, initialClientId, initialDate, initialTime])

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
      /* invalid time */
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      resetFormForInitialSlot()
    }
    onOpenChange(isOpen)
  }

  const wasOpenRef = useRef(open)

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      resetFormForInitialSlot()
    }
    wasOpenRef.current = open
  }, [open, resetFormForInitialSlot])

  useEffect(() => {
    if (!open) return
    setDate(initialDate)
    const st = formatTimeHm(parseTimeHm(initialTime))
    setStartTime(st)
    setEndTime(endTimeFromDuration(st, durationRef.current))
  }, [initialDate, initialTime, open])

  const handleServiceChange = (id: string) => {
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

  const handleStaffChange = (id: string) => {
    setStaffId(id)
    const member = staff.find((s) => s.id === id)
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

  const handleClientCreated = (newClient: Client) => {
    setLocalClients((prev) => [newClient, ...prev])
    onClientsChanged?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const localCheck = validateAppointmentWindow(startTime, endTime)
    if (!localCheck.ok) {
      setError(localCheck.error)
      return
    }
    setLoading(true)

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
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
          notes: notes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'خطا در ثبت نوبت')
        setLoading(false)
        return
      }

      if (!data.appointment) {
        setError('پاسخ ثبت نوبت کامل نبود')
        setLoading(false)
        return
      }

      onSuccess(data.appointment)
    } catch {
      setError('خطایی رخ داد')
    } finally {
      setLoading(false)
    }
  }

  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = []
    }
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  /** Managers are often unrestricted; autofill only among real staff to avoid false ambiguity. */
  const staffRoleOnly = useMemo(
    () => staff.filter((m) => m.role === 'staff'),
    [staff]
  )

  useEffect(() => {
    if (!open || !date || !startTime || !endTime) return
    const wc = validateAppointmentWindow(startTime, endTime)
    if (!wc.ok) {
      setStaffSlotOk({})
      return
    }
    const ctrl = new AbortController()
    const t = window.setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ date, startTime, endTime })
        const res = await fetch(`/api/staff/booking-availability?${qs}`, {
          credentials: 'include',
          signal: ctrl.signal,
        })
        const json = (await res.json()) as { staff?: Array<{ staffId: string; available: boolean }> }
        if (!res.ok) return
        const next: Record<string, boolean> = {}
        for (const row of json.staff ?? []) {
          next[row.staffId] = row.available
        }
        setStaffSlotOk(next)
      } catch {
        /* aborted */
      }
    }, 280)
    return () => {
      window.clearTimeout(t)
      ctrl.abort()
    }
  }, [open, date, startTime, endTime])

  useEffect(() => {
    if (staffId && staffSlotOk[staffId] === false) {
      setStaffId('')
    }
  }, [staffSlotOk, staffId])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>نوبت جدید</DrawerTitle>
          <DrawerDescription>
            مدت زمان پیشنهادی از روی خدمت انتخابی پر می‌شود. چند نوبت هم‌زمان فقط وقتی مجاز است
            که پرسنل و مشتری با نوبت‌های هم‌پوشان فرق کنند؛ در غیر این صورت پیام خطا نشان داده
            می‌شود.
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-auto px-4">
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

            {/* Nested column so staff always stacks above service (stable in RTL / flex layouts). */}
            <div className="flex min-w-0 flex-col gap-7">
              <Field>
                <FieldLabel>پرسنل</FieldLabel>
                <Select value={staffId || undefined} onValueChange={handleStaffChange} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب پرسنل" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffRoleOnly.map((member) => {
                      const unavailable = staffSlotOk[member.id] === false
                      return (
                        <SelectItem key={member.id} value={member.id} disabled={unavailable}>
                          {member.name}
                          {unavailable ? ' (خارج از برنامه)' : ''}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>خدمت</FieldLabel>
                <Select
                  value={serviceId || undefined}
                  onValueChange={handleServiceChange}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب خدمت" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          {CATEGORY_LABELS[category] || category}
                        </div>
                        {categoryServices.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} · پیشنهاد {toPersianDigits(service.duration)} دقیقه — {formatPrice(service.price)}
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
                <FieldLabel htmlFor="date">تاریخ</FieldLabel>
                <JalaliDatePicker
                  id="date"
                  value={date}
                  onChange={setDate}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="time">شروع</FieldLabel>
                <TimePicker
                  id="time"
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
              <FieldLabel>مدت (دقیقه)</FieldLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {DURATION_PRESETS.map((m) => (
                  <Button
                    key={m}
                    type="button"
                    size="sm"
                    variant={durationMinutes === m ? 'default' : 'outline'}
                    onClick={() => applyDuration(m)}
                  >
                    {new Intl.NumberFormat('fa-IR').format(m)}
                  </Button>
                ))}
              </div>
              <Input
                id="duration"
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
              <FieldLabel htmlFor="end-time">پایان</FieldLabel>
              <TimePicker
                id="end-time"
                value={endTime}
                onChange={applyEndTime}
                label="ساعت پایان"
              />
              <p className="text-xs text-muted-foreground mt-1">
                تغییر پایان، مدت را هم‌زمان به‌روز می‌کند.
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">توضیحات (اختیاری)</FieldLabel>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="توضیحات اضافی…"
              />
            </Field>

            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        </form>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={loading || !clientId || !serviceId || !staffId}>
            {loading && <Spinner className="ml-2" />}
            {loading ? 'در حال ثبت…' : 'ثبت نوبت'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">انصراف</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
