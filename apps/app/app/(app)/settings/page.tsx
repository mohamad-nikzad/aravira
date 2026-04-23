'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  LogOut,
  Moon,
  Sun,
  Users,
  Plus,
  Pencil,
  ChevronLeft,
  LayoutDashboard,
  ListChecks,
  UserRoundSearch,
} from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Avatar, AvatarFallback } from '@repo/ui/avatar'
import { Switch } from '@repo/ui/switch'
import { Input } from '@repo/ui/input'
import { Field, FieldLabel, FieldGroup } from '@repo/ui/field'
import { TimePicker } from '@repo/ui/time-picker'
import { useAuth } from '@/components/auth-provider'
import { Spinner } from '@repo/ui/spinner'
import { SettingsSkeleton } from '@/components/skeletons/settings-skeleton'
import { StaffPushSettings } from '@/components/pwa/staff-push-settings'
import { ServiceDrawer } from '@/components/services/service-drawer'
import { Badge } from '@repo/ui/badge'
import type { Service } from '@repo/salon-core/types'
import { SERVICE_CATEGORIES } from '@repo/salon-core/types'
import { displayPhone } from '@repo/salon-core/phone'
import { parseLocalizedInt, toPersianDigits } from '@repo/salon-core/persian-digits'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const [showServiceDrawer, setShowServiceDrawer] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const { data: bizData, mutate: mutateBiz } = useSWR(
    user?.role === 'manager' ? '/api/settings/business' : null,
    fetcher
  )
  const { data: svcData, mutate: mutateSvc } = useSWR(
    user?.role === 'manager' ? '/api/services?all=1' : null,
    fetcher
  )

  const [workingStart, setWorkingStart] = useState('09:00')
  const [workingEnd, setWorkingEnd] = useState('19:00')
  const [slotMin, setSlotMin] = useState(30)
  const [savingHours, setSavingHours] = useState(false)

  useEffect(() => {
    const s = bizData?.settings
    if (!s) return
    setWorkingStart(s.workingStart)
    setWorkingEnd(s.workingEnd)
    setSlotMin(s.slotDurationMinutes)
  }, [bizData])

  const services: Service[] = svcData?.services || []

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
  }

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled)
    if (enabled) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
  }

  const saveBusinessHours = async () => {
    setSavingHours(true)
    try {
      const res = await fetch('/api/settings/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workingStart,
          workingEnd,
          slotDurationMinutes: slotMin,
        }),
      })
      if (res.ok) await mutateBiz()
    } finally {
      setSavingHours(false)
    }
  }

  const settingsDataLoading = user?.role === 'manager' && !bizData && !svcData
  if (settingsDataLoading) {
    return <SettingsSkeleton />
  }

  if (!user) return null

  const isManager = user.role === 'manager'

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-4 bg-card px-4 py-3 border-b border-border/50">
        <div>
          <h1 className="text-lg font-bold">{isManager ? 'بیشتر' : 'تنظیمات'}</h1>
          {isManager && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              مدیریت، گزارش‌ها و تنظیمات سالن
            </p>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 py-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user.name}</p>
              <p className="text-sm text-muted-foreground truncate" dir="ltr">
                {displayPhone(user.phone)}
              </p>
              <Badge variant="secondary" className="text-[10px] mt-1">
                {user.role === 'manager' ? 'مدیر' : 'پرسنل'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {user.role === 'staff' && <StaffPushSettings />}

        {isManager && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">مدیریت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between touch-manipulation" asChild>
                <Link href="/dashboard">
                  <span className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    داشبورد و آمار
                  </span>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between touch-manipulation" asChild>
                <Link href="/retention">
                  <span className="flex items-center gap-2">
                    <UserRoundSearch className="h-4 w-4" />
                    پیگیری مشتریان
                  </span>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between touch-manipulation" asChild>
                <Link href="/staff">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    پرسنل و نقش‌ها
                  </span>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between touch-manipulation" asChild>
                <Link href="/onboarding">
                  <span className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    راه‌اندازی سالن
                  </span>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isManager && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ساعات کاری
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldGroup className="gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>شروع</FieldLabel>
                    <TimePicker
                      value={workingStart}
                      onChange={setWorkingStart}
                      label="ساعت شروع"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>پایان</FieldLabel>
                    <TimePicker
                      value={workingEnd}
                      onChange={setWorkingEnd}
                      label="ساعت پایان"
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>فاصله اسلات (دقیقه)</FieldLabel>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={toPersianDigits(slotMin)}
                    onChange={(e) => setSlotMin(Math.max(5, parseLocalizedInt(e.target.value, slotMin)))}
                    dir="rtl"
                    className="h-10 text-right tabular-nums"
                  />
                </Field>
              </FieldGroup>
              <Button
                size="sm"
                className="w-full touch-manipulation"
                disabled={savingHours}
                onClick={saveBusinessHours}
              >
                {savingHours ? 'در حال ذخیره…' : 'ذخیره ساعات کاری'}
              </Button>
            </CardContent>
          </Card>
        )}

        {isManager && (
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">خدمات</CardTitle>
              <Button
                size="sm"
                variant="secondary"
                className="gap-1 touch-manipulation"
                onClick={() => {
                  setSelectedService(null)
                  setShowServiceDrawer(true)
                }}
              >
                <Plus className="h-4 w-4" />
                جدید
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">هنوز خدمتی ثبت نشده.</p>
              ) : (
                services.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {SERVICE_CATEGORIES[s.category]?.label ?? s.category} · {toPersianDigits(s.duration)} دقیقه
                      </p>
                    </div>
                    {!s.active && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        غیرفعال
                      </Badge>
                    )}
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="touch-manipulation shrink-0"
                      onClick={() => {
                        setSelectedService(s)
                        setShowServiceDrawer(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">ظاهر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm">حالت تاریک</span>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="py-3">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <Spinner className="ml-2 h-4 w-4" />
              ) : (
                <LogOut className="ml-2 h-4 w-4" />
              )}
              {loggingOut ? 'در حال خروج…' : 'خروج از حساب'}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center pt-4 pb-2">
          <p className="text-xs font-medium text-muted-foreground/60">آراویرا</p>
          <p className="text-[10px] text-muted-foreground/40">نسخه ۱.۰.۰</p>
        </div>
      </div>

      {isManager && (
        <ServiceDrawer
          open={showServiceDrawer}
          onOpenChange={(o) => {
            setShowServiceDrawer(o)
            if (!o) setSelectedService(null)
          }}
          service={selectedService}
          onSuccess={() => {
            setShowServiceDrawer(false)
            setSelectedService(null)
            mutateSvc()
          }}
        />
      )}
    </div>
  )
}
