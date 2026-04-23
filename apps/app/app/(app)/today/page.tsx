'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import { AlertTriangle, CalendarDays, Clock, Users } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { JalaliDatePicker } from '@repo/ui/jalali-date-picker'
import { Spinner } from '@repo/ui/spinner'
import { useAuth } from '@/components/auth-provider'
import {
  NetworkStatusBanner,
  OfflineStateCard,
} from '@/components/pwa/offline-state'
import {
  fetchJsonOrThrow,
  useNetworkStatus,
  useOfflineSnapshot,
} from '@/lib/pwa-client'
import type { AppointmentWithDetails, TodayData } from '@repo/salon-core/types'
import { APPOINTMENT_STATUS } from '@repo/salon-core/types'
import { formatJalaliFullDate } from '@repo/salon-core/jalali'
import { formatPersianTime } from '@repo/salon-core/persian-digits'
import { cn } from '@repo/ui/utils'

async function fetcher<T>(url: string) {
  return fetchJsonOrThrow<T>(url)
}

export default function TodayPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isOnline = useNetworkStatus()
  const [date, setDate] = useState(
    () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' })
  )
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    if (user && user.role !== 'manager') {
      router.replace('/calendar')
    }
  }, [user, router])

  const swrKey = user?.role === 'manager' ? `/api/today?date=${date}` : null
  const {
    data: liveData,
    error,
    isLoading,
    mutate,
  } = useSWR<TodayData>(swrKey, fetcher)
  const snapshot = useOfflineSnapshot(
    swrKey ? `today:${date}` : null,
    liveData
  )
  const data = liveData ?? snapshot?.data

  const patchStatus = async (appointmentId: string, status: AppointmentWithDetails['status']) => {
    if (!isOnline) {
      return
    }

    setSavingId(appointmentId)
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      if (res.ok) await mutate()
    } finally {
      setSavingId(null)
    }
  }

  const grouped = useMemo(() => {
    if (!data?.appointments) return { scheduled: [] as AppointmentWithDetails[], rest: [] as AppointmentWithDetails[] }
    const scheduled: AppointmentWithDetails[] = []
    const rest: AppointmentWithDetails[] = []
    for (const apt of data.appointments) {
      if (apt.status === 'scheduled' || apt.status === 'confirmed') scheduled.push(apt)
      else rest.push(apt)
    }
    scheduled.sort((a, b) => a.startTime.localeCompare(b.startTime))
    rest.sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`))
    return { scheduled, rest }
  }, [data?.appointments])

  if (!user || user.role !== 'manager') return null

  if (!data && !isLoading) {
    return (
      <div className="flex h-full flex-col bg-background">
        <header className="border-b border-border/50 bg-card px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">امروز</h1>
            </div>
            <Button variant="outline" size="sm" className="touch-manipulation" asChild>
              <Link href="/calendar">تقویم</Link>
            </Button>
          </div>
          <div className="mt-3">
            <JalaliDatePicker value={date} onChange={setDate} />
          </div>
        </header>

        <NetworkStatusBanner
          routeLabel="نمای امروز"
          isOnline={isOnline}
          hasSnapshot={Boolean(snapshot)}
          snapshotUpdatedAt={snapshot?.updatedAt}
          hasError={Boolean(error)}
          onRetry={() => void mutate()}
        />

        <OfflineStateCard
          title="نمای امروز فعلا در دسترس نیست"
          description={
            isOnline
              ? 'بارگذاری اطلاعات امروز کامل نشد. دوباره تلاش کنید.'
              : 'برای اولین بارگذاری این بخش باید دوباره به اینترنت متصل شوید.'
          }
          onAction={() => void mutate()}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="border-b border-border/50 bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">امروز</h1>
          </div>
          <Button variant="outline" size="sm" className="touch-manipulation" asChild>
            <Link href="/calendar">تقویم</Link>
          </Button>
        </div>
        <div className="mt-3">
          <JalaliDatePicker value={date} onChange={setDate} />
        </div>
      </header>

      <NetworkStatusBanner
        routeLabel="نمای امروز"
        isOnline={isOnline}
        hasSnapshot={Boolean(snapshot)}
        snapshotUpdatedAt={snapshot?.updatedAt}
        hasError={Boolean(error)}
        onRetry={() => void mutate()}
      />

      <div className="flex-1 space-y-3 overflow-auto p-4">
        {!data ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {(Object.keys(data.counts) as Array<keyof typeof data.counts>).map((key) => (
                <Card key={key} className="border-border/50">
                  <CardContent className="py-3 text-center">
                    <p className="text-[10px] text-muted-foreground">{APPOINTMENT_STATUS[key].label}</p>
                    <p className="text-lg font-bold">{new Intl.NumberFormat('fa-IR').format(data.counts[key])}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {data.attentionItems.length > 0 && (
              <Card className="border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                    نیاز به توجه
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.attentionItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border/50 bg-card/80 px-3 py-2 text-sm"
                    >
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                      {item.clientId && (
                        <Button variant="link" className="h-auto p-0 text-xs" asChild>
                          <Link href={`/clients/${item.clientId}`}>پروفایل مشتری</Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  نوبت‌های فعال ({formatJalaliFullDate(data.date)})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {grouped.scheduled.length === 0 ? (
                  <p className="text-sm text-muted-foreground">نوبت فعالی برای این روز نیست.</p>
                ) : (
                  grouped.scheduled.map((apt) => (
                    <div
                      key={apt.id}
                      className="rounded-xl border border-border/60 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{apt.client.name}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">
                            {formatPersianTime(apt.startTime)} – {formatPersianTime(apt.endTime)} · {apt.staff.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{apt.service.name}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {APPOINTMENT_STATUS[apt.status].label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {apt.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="touch-manipulation h-8 text-xs"
                            disabled={savingId === apt.id || !isOnline}
                            onClick={() => void patchStatus(apt.id, 'confirmed')}
                          >
                            تایید
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="touch-manipulation h-8 text-xs"
                          disabled={savingId === apt.id || !isOnline}
                          onClick={() => void patchStatus(apt.id, 'completed')}
                        >
                          انجام شد
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="touch-manipulation h-8 text-xs"
                          disabled={savingId === apt.id || !isOnline}
                          onClick={() => void patchStatus(apt.id, 'no-show')}
                        >
                          غیبت
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="touch-manipulation h-8 text-xs text-destructive"
                          disabled={savingId === apt.id || !isOnline}
                          onClick={() => void patchStatus(apt.id, 'cancelled')}
                        >
                          لغو
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  بار کاری پرسنل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {data.staffLoad.map((row) => (
                  <div key={row.staffId} className="flex items-center justify-between border-b border-border/40 py-2 last:border-0">
                    <span>{row.staffName}</span>
                    <span className="text-muted-foreground" dir="ltr">
                      {new Intl.NumberFormat('fa-IR').format(row.appointmentCount)} نوبت ·{' '}
                      {new Intl.NumberFormat('fa-IR').format(row.bookedMinutes)} دقیقه
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">اسلات‌های خالی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {data.openSlots.every((s) => s.ranges.length === 0) ? (
                  <p className="text-muted-foreground">اسلات خالی قابل نمایش نیست (برنامه کاری یا نوبت‌ها).</p>
                ) : (
                  data.openSlots.map((slot) => (
                    <div key={slot.staffId}>
                      <p className="font-medium">{slot.staffName}</p>
                      {slot.ranges.length === 0 ? (
                        <p className="text-xs text-muted-foreground">بدون بازه آزاد</p>
                      ) : (
                        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground" dir="ltr">
                          {slot.ranges.map((r, i) => (
                            <li key={i}>
                              {formatPersianTime(r.startTime)} – {formatPersianTime(r.endTime)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {grouped.rest.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">سایر وضعیت‌ها</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {grouped.rest.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">
                        {apt.client.name} · {formatPersianTime(apt.startTime)}
                      </span>
                      <Badge variant="outline" className={cn('shrink-0 text-[10px]', APPOINTMENT_STATUS[apt.status].color)}>
                        {APPOINTMENT_STATUS[apt.status].label}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
