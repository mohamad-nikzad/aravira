'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  LogOut,
  Moon,
  Sun,
  Users,
  UserPlus,
  Banknote,
  Bell,
  ChevronLeft,
  Globe,
  LayoutDashboard,
  ListChecks,
  Scissors,
  UserRoundSearch,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Switch } from '@repo/ui/switch'
import { Input } from '@repo/ui/input'
import { Field, FieldError, FieldLabel, FieldGroup } from '@repo/ui/field'
import { FormRootError } from '@repo/ui/form'
import { TimePicker } from '@repo/ui/time-picker'
import { Badge, type badgeVariants } from '@repo/ui/badge'
import { Spinner } from '@repo/ui/spinner'
import { SakuraMark } from '@repo/ui/sakura-mark'
import { cn } from '@repo/ui/utils'
import type { VariantProps } from 'class-variance-authority'
import { useAuth } from '@/components/auth-provider'
import {
  useBumpOfflineData,
  useManagerDataClient,
} from '@/components/manager-data-client-provider'
import { SettingsSkeleton } from '@/components/skeletons/settings-skeleton'
import { StaffPushSettings } from '@/components/pwa/staff-push-settings'
import { displayPhone } from '@repo/salon-core/phone'
import {
  parseLocalizedInt,
  toPersianDigits,
} from '@repo/salon-core/persian-digits'
import {
  businessSettingsSchema,
  type BusinessSettingsPayload,
} from '@repo/salon-core/forms/settings'

type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['variant']>

type DashboardMetrics = {
  monthRevenue: number
  totalClients: number
  newClientsThisMonth: number
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '؟'
  if (parts.length === 1) return parts[0].slice(0, 2)
  return `${parts[0][0]}${parts[1][0]}`
}

function formatRevenueCompact(value: number) {
  if (value >= 1_000_000) {
    return `${toPersianDigits((value / 1_000_000).toFixed(1).replace('.', '٫'))} م`
  }
  if (value >= 1_000) {
    return `${toPersianDigits(Math.round(value / 1_000))} هـ`
  }
  return toPersianDigits(value)
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-1.5 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  )
}

function SettingsGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <GroupLabel>{label}</GroupLabel>
      <div className="divide-y divide-line-soft overflow-hidden rounded-[18px] border border-line-soft bg-card">
        {children}
      </div>
    </div>
  )
}

function SettingsRow({
  icon: Icon,
  label,
  hint,
  href,
  onClick,
  badge,
  badgeTone = 'plum',
  danger,
  loading,
  disabled,
}: {
  icon: LucideIcon
  label: string
  hint?: string
  href?: string
  onClick?: () => void
  badge?: string
  badgeTone?: BadgeTone
  danger?: boolean
  loading?: boolean
  disabled?: boolean
}) {
  const inner = (
    <>
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-xl',
          danger ? 'bg-destructive-soft text-destructive' : 'bg-blush-soft text-plum-deep',
        )}
      >
        {loading ? <Spinner className="size-[18px]" /> : <Icon className="size-[18px]" />}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'text-sm font-semibold',
            danger ? 'text-destructive' : 'text-foreground',
          )}
        >
          {label}
        </div>
        {hint ? <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div> : null}
      </div>
      {badge ? <Badge variant={badgeTone}>{badge}</Badge> : null}
      {!danger ? <ChevronLeft className="size-4 shrink-0 text-muted-foreground" /> : null}
    </>
  )

  const className =
    'flex w-full touch-manipulation items-center gap-3.5 px-4 py-3.5 text-start transition-colors active:bg-accent/40 disabled:opacity-60'

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {inner}
    </button>
  )
}

function ToggleRow({
  icon: Icon,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  icon: LucideIcon
  label: string
  hint?: string
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-paper-deep text-sage-deep">
        <Icon className="size-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {hint ? <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div> : null}
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="flex-1 rounded-[18px] border border-line-soft bg-card p-3">
      <Icon className={cn('size-4', accent)} strokeWidth={1.8} />
      <div className="mt-1.5 text-lg font-extrabold tracking-tight tabular-nums text-foreground">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const dc = useManagerDataClient()
  const bumpOfflineData = useBumpOfflineData()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [managerDataReady, setManagerDataReady] = useState(false)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [localAlerts, setLocalAlerts] = useState<boolean | null>(null)
  const [savingAlerts, setSavingAlerts] = useState(false)

  const {
    handleSubmit: handleBusinessHoursSubmit,
    reset: resetBusinessHours,
    setError: setBusinessHoursError,
    setValue: setBusinessHoursValue,
    watch: watchBusinessHours,
    formState: { errors: businessHoursErrors, isSubmitting: savingHours },
  } = useForm<BusinessSettingsPayload>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      workingStart: '09:00',
      workingEnd: '19:00',
      slotDurationMinutes: 30,
    },
  })
  const workingStart = watchBusinessHours('workingStart') ?? '09:00'
  const workingEnd = watchBusinessHours('workingEnd') ?? '19:00'
  const slotMin = watchBusinessHours('slotDurationMinutes') ?? 30

  useEffect(() => {
    if (!dc || user?.role !== 'manager') {
      setManagerDataReady(true)
      return
    }
    let cancelled = false
    void dc.businessSettings
      .get()
      .then((s) => {
        if (cancelled || !s) return
        resetBusinessHours(s)
      })
      .finally(() => {
        if (!cancelled) setManagerDataReady(true)
      })
    const unsubBiz = dc.businessSettings.subscribe((s) => {
      if (cancelled || !s) return
      resetBusinessHours(s)
    })
    return () => {
      cancelled = true
      unsubBiz()
    }
  }, [dc, resetBusinessHours, user?.role])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    void fetch('/api/notification-preferences', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.preferences) {
          setLocalAlerts(Boolean(data.preferences.localAlertsEnabled))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (user?.role !== 'manager') return
    let cancelled = false
    void fetch('/api/dashboard', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.totalClients === 'number') {
          setMetrics(data)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user?.role])

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
  }

  const toggleDarkMode = (enabled: boolean) => {
    setTheme(enabled ? 'dark' : 'light')
  }

  const toggleLocalAlerts = async (next: boolean) => {
    setLocalAlerts(next)
    setSavingAlerts(true)
    try {
      const res = await fetch('/api/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ localAlertsEnabled: next }),
      })
      if (!res.ok) throw new Error('update failed')
    } catch {
      setLocalAlerts(!next)
    } finally {
      setSavingAlerts(false)
    }
  }

  const saveBusinessHours = handleBusinessHoursSubmit(async (values) => {
    if (!dc) return
    try {
      await dc.businessSettings.update(values)
      bumpOfflineData()
    } catch {
      setBusinessHoursError('root', { message: 'ذخیره ساعات کاری انجام نشد' })
    }
  })

  const settingsDataLoading =
    user?.role === 'manager' && (!dc || !managerDataReady)
  if (settingsDataLoading) {
    return <SettingsSkeleton />
  }

  if (!user) return null

  const isManager = user.role === 'manager'
  const darkMode = mounted ? theme === 'dark' : false

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="border-b border-line-soft bg-card px-5 pt-3.5 pb-4">
        <div className="text-[22px] font-extrabold tracking-tight text-foreground">
          {isManager ? 'بیشتر' : 'تنظیمات'}
        </div>
        {isManager ? (
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            مدیریت، گزارش‌ها و تنظیمات سالن
          </div>
        ) : null}
      </header>

      <div className="flex-1 overflow-auto px-5 pb-7 pt-4">
        <div className="flex flex-col gap-4">
          <div className="profile-surface relative flex items-center gap-3.5 overflow-hidden rounded-[22px] p-4">
            <SakuraMark
              size={150}
              color="rgba(124,45,66,.10)"
              style={{ position: 'absolute', insetInlineStart: -30, top: -30 }}
            />
            <div className="relative flex size-14 shrink-0 items-center justify-center rounded-[18px] bg-primary text-lg font-extrabold text-primary-foreground">
              {getInitials(user.name)}
            </div>
            <div className="relative min-w-0 flex-1">
              <div className="truncate text-base font-bold text-foreground">{user.name}</div>
              <div className="mt-0.5 text-xs text-sage-deep" dir="ltr">
                {displayPhone(user.phone)}
              </div>
              <div className="mt-2">
                <Badge variant="plum">{isManager ? 'مدیر' : 'پرسنل'}</Badge>
              </div>
            </div>
          </div>

          {isManager && metrics ? (
            <div className="flex gap-2.5">
              <MetricTile
                icon={Banknote}
                label="درآمد ماه"
                value={formatRevenueCompact(metrics.monthRevenue)}
                accent="text-mint"
              />
              <MetricTile
                icon={Users}
                label="مشتری فعال"
                value={toPersianDigits(metrics.totalClients)}
                accent="text-plum-deep"
              />
              <MetricTile
                icon={UserPlus}
                label="جدید این ماه"
                value={toPersianDigits(metrics.newClientsThisMonth)}
                accent="text-sky"
              />
            </div>
          ) : null}

          {user.role === 'staff' ? <StaffPushSettings /> : null}

          {isManager ? (
            <SettingsGroup label="مدیریت سالن">
              <SettingsRow
                icon={LayoutDashboard}
                label="داشبورد و آمار"
                hint="گزارش روزانه و عملکرد"
                href="/dashboard"
              />
              <SettingsRow
                icon={UserRoundSearch}
                label="پیگیری مشتریان"
                hint="مشتریانی که نیاز به پیگیری دارند"
                href="/retention"
              />
              <SettingsRow
                icon={Scissors}
                label="خدمات و قیمت‌ها"
                hint="بخش‌ها، گروه‌ها، مدت و قیمت"
                href="/services"
              />
              <SettingsRow
                icon={Users}
                label="پرسنل و نقش‌ها"
                hint="مدیریت پرسنل، خدمات و ساعت کاری"
                href="/staff"
              />
              <SettingsRow
                icon={Globe}
                label="صفحه عمومی سالن"
                hint="لینک نوبت‌گیری برای مشتریان"
                href="/public-page"
              />
              <SettingsRow
                icon={ListChecks}
                label="راه‌اندازی سالن"
                hint="مراحل آماده‌سازی"
                href="/onboarding"
              />
            </SettingsGroup>
          ) : null}

          {localAlerts !== null ? (
            <SettingsGroup label="اعلان‌ها">
              <ToggleRow
                icon={Bell}
                label="اعلان درون‌برنامه"
                hint="یادآور نوبت‌ها و درخواست‌ها"
                checked={localAlerts}
                disabled={savingAlerts}
                onChange={(next) => void toggleLocalAlerts(next)}
              />
            </SettingsGroup>
          ) : null}

          {isManager ? (
            <div>
              <GroupLabel>ساعات کاری</GroupLabel>
              <div className="space-y-4 rounded-[18px] border border-line-soft bg-card p-4">
                <FieldGroup className="gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel>شروع</FieldLabel>
                      <TimePicker
                        value={workingStart}
                        onChange={(value) =>
                          setBusinessHoursValue('workingStart', value)
                        }
                        label="ساعت شروع"
                      />
                      {businessHoursErrors.workingStart && (
                        <FieldError>
                          {businessHoursErrors.workingStart.message}
                        </FieldError>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel>پایان</FieldLabel>
                      <TimePicker
                        value={workingEnd}
                        onChange={(value) =>
                          setBusinessHoursValue('workingEnd', value)
                        }
                        label="ساعت پایان"
                      />
                      {businessHoursErrors.workingEnd && (
                        <FieldError>
                          {businessHoursErrors.workingEnd.message}
                        </FieldError>
                      )}
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>فاصله اسلات (دقیقه)</FieldLabel>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={toPersianDigits(slotMin)}
                      onChange={(e) =>
                        setBusinessHoursValue(
                          'slotDurationMinutes',
                          Math.max(5, parseLocalizedInt(e.target.value, slotMin)),
                        )
                      }
                      dir="rtl"
                      className="h-10 text-right tabular-nums"
                    />
                    {businessHoursErrors.slotDurationMinutes && (
                      <FieldError>
                        {businessHoursErrors.slotDurationMinutes.message}
                      </FieldError>
                    )}
                  </Field>
                </FieldGroup>
                <FormRootError message={businessHoursErrors.root?.message} />
                <Button
                  size="sm"
                  className="w-full touch-manipulation"
                  disabled={savingHours}
                  onClick={saveBusinessHours}
                >
                  {savingHours ? 'در حال ذخیره…' : 'ذخیره ساعات کاری'}
                </Button>
              </div>
            </div>
          ) : null}

          <SettingsGroup label="ظاهر">
            <ToggleRow
              icon={darkMode ? Moon : Sun}
              label="حالت تاریک"
              hint="هماهنگ با سیستم"
              checked={darkMode}
              disabled={!mounted}
              onChange={toggleDarkMode}
            />
          </SettingsGroup>

          <SettingsGroup label="حساب">
            <SettingsRow
              icon={LogOut}
              label={loggingOut ? 'در حال خروج…' : 'خروج از حساب'}
              onClick={() => void handleLogout()}
              danger
              loading={loggingOut}
              disabled={loggingOut}
            />
          </SettingsGroup>

          <div className="pb-2 pt-2 text-center">
            <div className="text-[13px] font-bold tracking-wide text-muted-foreground/60">
              سالورا
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground/40">
              نسخه ۱.۰.۰
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
