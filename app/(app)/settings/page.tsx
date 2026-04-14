'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { LogOut, Moon, Sun, Users, Plus, Pencil, ChevronLeft, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field'
import { useAuth } from '@/components/auth-provider'
import { Spinner } from '@/components/ui/spinner'
import { ServiceDrawer } from '@/components/services/service-drawer'
import { Badge } from '@/components/ui/badge'
import type { Service } from '@/lib/types'
import { SERVICE_CATEGORIES } from '@/lib/types'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth()
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

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!user) return null

  const isManager = user.role === 'manager'

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-4 bg-card px-4 py-3 border-b border-border/50">
        <h1 className="text-lg font-bold">تنظیمات</h1>
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
                {user.phone}
              </p>
              <Badge variant="secondary" className="text-[10px] mt-1">
                {user.role === 'manager' ? 'مدیر' : 'پرسنل'}
              </Badge>
            </div>
          </CardContent>
        </Card>

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
                <Link href="/staff">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    پرسنل و نقش‌ها
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
                    <Input
                      type="time"
                      value={workingStart}
                      onChange={(e) => setWorkingStart(e.target.value)}
                      dir="ltr"
                      className="h-10"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>پایان</FieldLabel>
                    <Input
                      type="time"
                      value={workingEnd}
                      onChange={(e) => setWorkingEnd(e.target.value)}
                      dir="ltr"
                      className="h-10"
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>فاصله اسلات (دقیقه)</FieldLabel>
                  <Input
                    type="number"
                    min={5}
                    step={5}
                    value={slotMin}
                    onChange={(e) => setSlotMin(Number(e.target.value))}
                    dir="ltr"
                    className="text-left h-10"
                  />
                </Field>
              </FieldGroup>
              <Button
                size="sm"
                className="w-full touch-manipulation"
                disabled={savingHours}
                onClick={saveBusinessHours}
              >
                {savingHours ? 'در حال ذخیره...' : 'ذخیره ساعات کاری'}
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
                        {SERVICE_CATEGORIES[s.category]?.label ?? s.category} · {s.duration} دقیقه
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
              {loggingOut ? 'در حال خروج...' : 'خروج از حساب'}
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
