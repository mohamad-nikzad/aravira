'use client'

import { useState, useEffect, useRef } from 'react'
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
import { User, Service, Client } from '@/lib/types'
import {
  APPOINTMENT_DURATION_BOUNDS,
  durationMinutesFromRange,
  endTimeFromDuration,
  formatTimeHm,
  parseTimeHm,
  validateAppointmentWindow,
} from '@/lib/appointment-time'
import { ClientPicker } from '@/components/calendar/client-picker'
import { JalaliDatePicker } from '@/components/ui/jalali-date-picker'
import { TimePicker } from '@/components/ui/time-picker'

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
  staff: User[]
  services: Service[]
  clients: Client[]
  onSuccess: () => void
  onClientsChanged?: () => void
}

export function AppointmentDrawer({
  open,
  onOpenChange,
  initialDate,
  initialTime,
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
  const durationRef = useRef(durationMinutes)
  durationRef.current = durationMinutes

  useEffect(() => {
    setLocalClients(clients)
  }, [clients])

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
      const d = 45
      durationRef.current = d
      setDurationMinutes(d)
      setDate(initialDate)
      const st = formatTimeHm(parseTimeHm(initialTime))
      setStartTime(st)
      setEndTime(endTimeFromDuration(st, d))
      setClientId('')
      setStaffId('')
      setServiceId('')
      setNotes('')
      setError('')
      setLocalClients(clients)
    }
    onOpenChange(isOpen)
  }

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

      onSuccess()
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

            <Field>
              <FieldLabel>خدمت</FieldLabel>
              <Select value={serviceId} onValueChange={handleServiceChange} required>
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
                          {service.name} · پیشنهاد {service.duration} دقیقه — {formatPrice(service.price)}
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
                placeholder="توضیحات اضافی..."
              />
            </Field>

            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        </form>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={loading || !clientId || !serviceId || !staffId}>
            {loading && <Spinner className="ml-2" />}
            {loading ? 'در حال ثبت...' : 'ثبت نوبت'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">انصراف</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
