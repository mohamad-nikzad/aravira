'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { TimePicker } from '@/components/ui/time-picker'
import { Spinner } from '@/components/ui/spinner'
import type { BusinessHours, StaffSchedule, User } from '@/lib/types'

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json())

const days = [
  { dayOfWeek: 6, label: 'شنبه' },
  { dayOfWeek: 0, label: 'یکشنبه' },
  { dayOfWeek: 1, label: 'دوشنبه' },
  { dayOfWeek: 2, label: 'سه‌شنبه' },
  { dayOfWeek: 3, label: 'چهارشنبه' },
  { dayOfWeek: 4, label: 'پنجشنبه' },
  { dayOfWeek: 5, label: 'جمعه' },
] as const

type ScheduleDraft = {
  dayOfWeek: number
  active: boolean
  workingStart: string
  workingEnd: string
}

interface StaffScheduleDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: User | null
  onSuccess: () => void
}

function defaultRows(hours?: BusinessHours): ScheduleDraft[] {
  return days.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    active: day.dayOfWeek !== 5,
    workingStart: hours?.workingStart ?? '09:00',
    workingEnd: hours?.workingEnd ?? '19:00',
  }))
}

export function StaffScheduleDrawer({
  open,
  onOpenChange,
  staff,
  onSuccess,
}: StaffScheduleDrawerProps) {
  const [rows, setRows] = useState<ScheduleDraft[]>(defaultRows())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading, mutate } = useSWR<{
    schedule: StaffSchedule[]
    businessHours: BusinessHours
  }>(open && staff ? `/api/staff/${staff.id}/schedule` : null, fetcher)

  const businessHours = data?.businessHours

  const scheduleByDay = useMemo(() => {
    const map = new Map<number, StaffSchedule>()
    for (const row of data?.schedule ?? []) map.set(row.dayOfWeek, row)
    return map
  }, [data?.schedule])

  useEffect(() => {
    if (!open) return
    const base = defaultRows(businessHours)
    setRows(
      base.map((row) => {
        const saved = scheduleByDay.get(row.dayOfWeek)
        return saved
          ? {
              dayOfWeek: saved.dayOfWeek,
              active: saved.active,
              workingStart: saved.workingStart,
              workingEnd: saved.workingEnd,
            }
          : row
      })
    )
    setError('')
  }, [businessHours, open, scheduleByDay])

  const updateRow = (dayOfWeek: number, patch: Partial<ScheduleDraft>) => {
    setRows((current) =>
      current.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row))
    )
  }

  const useSalonHours = () => {
    if (!businessHours) return
    setRows((current) =>
      current.map((row) => ({
        ...row,
        workingStart: businessHours.workingStart,
        workingEnd: businessHours.workingEnd,
      }))
    )
  }

  const handleSave = async () => {
    if (!staff) return
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/staff/${staff.id}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ schedule: rows }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(payload.error || 'ذخیره برنامه کاری انجام نشد')
        return
      }
      await mutate()
      onSuccess()
    } catch {
      setError('خطایی رخ داد. لطفاً دوباره تلاش کنید.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>برنامه کاری {staff?.name ?? ''}</DrawerTitle>
          <DrawerDescription>
            برای هر روز، فعال بودن و بازه کاری پرسنل را مشخص کنید.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-3 overflow-auto px-4">
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div className="text-sm">
              <p className="font-medium">ساعت سالن</p>
              <p className="text-xs text-muted-foreground" dir="ltr">
                {businessHours?.workingStart ?? '09:00'} - {businessHours?.workingEnd ?? '19:00'}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={useSalonHours}>
              استفاده برای همه
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            rows.map((row) => {
              const label = days.find((day) => day.dayOfWeek === row.dayOfWeek)?.label
              return (
                <div key={row.dayOfWeek} className="rounded-lg border border-border/60 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.active ? 'قابل رزرو' : 'تعطیل برای این پرسنل'}
                      </p>
                    </div>
                    <Switch
                      checked={row.active}
                      onCheckedChange={(active) => updateRow(row.dayOfWeek, { active })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel>شروع</FieldLabel>
                      <TimePicker
                        value={row.workingStart}
                        onChange={(workingStart) => updateRow(row.dayOfWeek, { workingStart })}
                        label={`${label} شروع`}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>پایان</FieldLabel>
                      <TimePicker
                        value={row.workingEnd}
                        onChange={(workingEnd) => updateRow(row.dayOfWeek, { workingEnd })}
                        label={`${label} پایان`}
                      />
                    </Field>
                  </div>
                </div>
              )
            })
          )}

          {error && <FieldError>{error}</FieldError>}
        </div>

        <DrawerFooter>
          <Button onClick={handleSave} disabled={saving || isLoading}>
            {saving && <Spinner className="ml-2" />}
            {saving ? 'در حال ذخیره...' : 'ذخیره برنامه کاری'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            بستن
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
